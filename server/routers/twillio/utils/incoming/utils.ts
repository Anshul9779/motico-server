import { CallStatus } from "@prisma/client";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import prisma from "../../../../prisma";

export const terminateCall = async (callId: string) => {
  const id = parseInt(callId, 10);
  await prisma.call.update({
    where: { id },
    data: {
      status: CallStatus.ENDED,
    },
  });
  const twiml = new VoiceResponse();
  twiml.say("Thank you for calling. We are hanging up now!");
  twiml.hangup();
  return twiml.toString();
};
