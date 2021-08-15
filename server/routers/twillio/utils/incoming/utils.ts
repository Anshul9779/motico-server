import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

export const terminateCall = () => {
  const twiml = new VoiceResponse();
  twiml.say("Thank you for calling. We are hanging up now!");
  twiml.hangup();
  return twiml.toString();
};
