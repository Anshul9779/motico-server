import NumberSetting, {
  NumberSettingDocument,
} from "./../../../../models/NumberSettings";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { forwardCallTo } from "./department";
import { terminateCall } from "./utils";
import CallRecorModel from "../../../../models/CallRecord";

/**
 *
 *  HANDLING IVR
 *
 *
 *  1. ivrStep1 -> Say/Play the initial audio -> Wait for the cus to respond
 *  2. ivrStep2 -> If cus selects a department -> Handle call for that department -> Say/Play things -> Call that function
 *              -> Else say goodbye and terminate
 */

/**
 *
 */
export const ivrStep1 = (
  callRecordId: string,
  setting: NumberSettingDocument
) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    action: `https://moticosolutions.com/api/twillio/ivr/menu?callRecord=${callRecordId}`,
    numDigits: 1,
    method: "POST",
  });
  if (setting.greetingMessageStatus !== "DISABLED") {
    // handle the greeting stuff
    console.log("Transferring to greeting");
    if (
      setting.greetingMessageStatus === "TEXT" &&
      setting.greetingMessageInfo
    ) {
      console.log("Text", setting.greetingMessageInfo);
      gather.say(setting.greetingMessageInfo);
      gather.pause({
        length: 1,
      });
    } else if (setting.greetingMessageStatus === "AUDIO") {
      gather.play(`https://api.twilio.com/cowbell.mp3`);
    }
  }
  if (setting.ivrStatus === "TEXT") {
    gather.say(setting.ivrInfo);
    gather.pause({
      length: 1,
    });
  }
  if (setting.ivrStatus === "AUDIO") {
    gather.play(`https://api.twilio.com/cowbell.mp3`);
  }
  // Check the ivr data and do accordingly
  if (setting.ivrData) {
    const parsedData: { phoneNumberId: string; label: string }[] = JSON.parse(
      setting.ivrData
    );
    parsedData.forEach((ivr, index) => {
      gather.say(`Press ${index + 1} to connect to ${ivr.label}`);
      gather.pause({
        length: 0.5,
      });
    });
  }

  return twiml.toString();
};

export const ivrStep2 = async (
  callRecordId: string,
  digit: string | number
) => {
  const to = (await CallRecorModel.findById(callRecordId).exec()).to;
  const settings = await NumberSetting.findOne({
    number: to,
  }).exec();
  const parsedData: { phoneNumberId: string; label: string }[] = JSON.parse(
    settings.ivrData
  );
  const numberDigit = Number(digit);
  return parsedData[numberDigit]
    ? forwardCallTo(parsedData[numberDigit].phoneNumberId)
    : terminateCall();
};
