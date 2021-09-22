// Handles the incoming call stuff
import { Response, Request } from "express";
import NumberSetting from "./../../../../models/NumberSettings";
import CallRecordModel from "./../../../../models/CallRecord";
import PhoneNumberModel from "./../../../../models/PhoneNumber";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { ivrStep1 } from "./ivr";

export const handleIncomingCall = async (req: Request, res: Response) => {
  /**
   * for incoming call handle cases :
   *
   * 1. Cus calling for IVR ?
   * 2. Agent available or dial tone ?
   * 3. Connecting to Agent, Greeting Music
   */
  console.log("Incoming", req.body);
  if (!req.body) {
    return "ERR";
  }
  const phoneNumber = await PhoneNumberModel.findOne({
    number: (req.body as unknown as any).To,
  }).exec();
  if (!phoneNumber) {
    return res.send("ERR");
  }

  const setting = await NumberSetting.findOne({
    phoneNumber: phoneNumber._id,
  });

  if (!setting) {
    console.log("Settings not created for", phoneNumber.number);
    return res.send("ERR");
  }
  const callRecordDetails = {
    from: (req.body as unknown as any).From,
    to: (req.body as unknown as any).To,
    type: "INCOMING",
    isActive: true,
    company: phoneNumber.company,
    callSid: "",
  };
  // Start a Call Record and Return the ID;
  const callRecord = await CallRecordModel.create(callRecordDetails);

  // Number 1. IVR
  if (setting.ivrStatus !== "DISABLED") {
    // DO IVR WAITING STUFF
    console.log("Transfering to IVR");
    return res.send(ivrStep1(callRecord._id, setting));
  }
  const twiml = new VoiceResponse();

  // TODO: Check if it goes to voicemail ?
  // Check if agents are available?

  if (setting.greetingMessageStatus !== "DISABLED") {
    // handle the greeting stuff
    console.log("Transferring to greeting");
    if (setting.greetingMessageStatus === "TEXT") {
      twiml.say(setting.greetingMessageInfo);
    } else {
      twiml.play(
        `https://api.twilio.com/cowbell.mp3`
      );
    }
    const dial = twiml.dial();
    dial.conference(`conf_${callRecord._id}`);
    return res.send(twiml.toString());
  }
  console.log("Default");

  twiml.say("Thank you for calling us. An agent will join in some time.");
  const dial = twiml.dial();
  dial.conference(`conf_${callRecord._id}`);
  return res.send(twiml.toString());
};
