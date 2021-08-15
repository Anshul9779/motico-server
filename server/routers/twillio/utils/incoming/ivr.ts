import { NumberSettingDocument } from "./../../../../models/NumberSettings";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { departmentHandleIncoming } from "./department";
import { terminateCall } from "./utils";

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
    action: `/api/twillio/ivr/menu?callRecord=${callRecordId}`,
    numDigits: 1,
    method: "POST",
  });
  if (setting.ivrStatus === "TEXT") {
    gather.say(setting.ivrInfo);
  }
  if (setting.ivrStatus === "AUDIO") {
    gather.play(`https://moticosolutions.com/api/aws/${setting.ivrInfo}`);
  }
  return twiml.toString();
};

export const ivrStep2 = (callRecordId: string, digit: string | number) => {
  // Get these from number settings
  const options: Record<string | number, string> = {
    1: "team 1",
    2: "team 2",
  };
  return options[digit]
    ? departmentHandleIncoming(options[digit])
    : terminateCall();
};
