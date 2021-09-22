import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

export const forwardCallTo = (number:string): string => {
  const twiml = new VoiceResponse();
  twiml.dial(number);
  return twiml.toString();
};
