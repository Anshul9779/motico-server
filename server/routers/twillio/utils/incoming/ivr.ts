import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { forwardCallTo } from "./department";
import { terminateCall } from "./utils";
import logger from "../../../../logger";
import { PhoneNumberSettings } from "@prisma/client";
import prisma from "../../../../prisma";

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
export const ivrStep1 = (callId: number, setting: PhoneNumberSettings) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    action: `https://moticosolutions.com/api/twillio/ivr/menu?callRecord=${callId}`,
    numDigits: 1,
    method: "POST",
  });
  if (setting.greetingMsgStatus !== "DISABLED") {
    // handle the greeting stuff
    logger.log("info", {
      timestamp: new Date().toISOString(),
      function: "routers.twillio.utils.incoming.ivr.ivrStep1",
      message: "Transferring to greeting",
    });
    if (setting.greetingMsgText === "TEXT" && setting.greetingMsgText) {
      logger.log("info", {
        timestamp: new Date().toISOString(),
        function: "routers.twillio.utils.incoming.ivr.ivrStep1",
        message: "Text " + setting.greetingMsgText,
      });
      gather.say(setting.greetingMsgText);
      gather.pause({
        length: 1,
      });
    } else if (setting.greetingMsgStatus === "AUDIO") {
      gather.play(`https://api.twilio.com/cowbell.mp3`);
    }
  }
  // if (setting.ivrEnabled) {
  //   gather.say(setting.ivrInfo);
  //   gather.pause({
  //     length: 1,
  //   });
  // }

  // Check the ivr data and do accordingly
  if (setting.ivrEnabled && setting.ivrData) {
    const parsedData = setting.ivrData as {
      phoneNumberId: string;
      label: string;
    }[];

    parsedData.forEach((ivr, index) => {
      gather.say(`Press ${index + 1} to connect to ${ivr.label}`);
      gather.pause({
        length: 0.5,
      });
    });
  }

  return twiml.toString();
};

export const ivrStep2 = async (callId: string, digit: string | number) => {
  const {
    from: { settings },
  } = await prisma.call.findUnique({
    where: {
      id: parseInt(callId, 10),
    },
    include: {
      from: {
        include: {
          settings: true,
        },
      },
    },
  });
  const parsedData = settings.ivrData as {
    phoneNumberId: string;
    label: string;
  }[];
  const numberDigit = Number(digit);
  return parsedData[numberDigit]
    ? forwardCallTo(parsedData[numberDigit].phoneNumberId)
    : terminateCall();
};
