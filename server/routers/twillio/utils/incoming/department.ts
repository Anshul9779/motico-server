import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import prisma from "../../../../prisma";

export const forwardCallToTeam = async (
  id: number,
  callId: string
): Promise<string> => {
  const { phoneNumber } = await prisma.team.findUnique({
    where: { id },
    include: { phoneNumber: true },
  });
  const twiml = new VoiceResponse();
  twiml.dial(phoneNumber.number);
  return twiml.toString();
};
