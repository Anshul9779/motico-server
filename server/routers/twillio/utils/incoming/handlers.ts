// Handles the incoming call stuff
import { Response, Request } from "express";
import NumberSetting from "./../../../../models/NumberSettings";
import CallRecordModel from "./../../../../models/CallRecord";
import PhoneNumberModel from "./../../../../models/PhoneNumber";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { ivrStep1 } from "./ivr";
import logger from "../../../../logger";

export const handleIncomingCall = async (req: Request, res: Response) => {
  /**
   * for incoming call handle cases :
   *
   * 1. Cus calling for IVR ?
   * 2. Agent available or dial tone ?
   * 3. Connecting to Agent, Greeting Music
   */
  logger.log("info", {
    timestamp: new Date().toISOString(),
    function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
    message: req.body,
  });
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
  logger.log("info", {
    timestamp: new Date().toISOString(),
    function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
    message: setting,
  });

  if (!setting) {
    logger.log("info", {
      timestamp: new Date().toISOString(),
      function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
      message: "Settings not created for " + phoneNumber.number,
    });
    return res.status(500).send("ERR");
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
  res.type("text/xml");
  // Number 1. IVR
  if (setting.ivrStatus !== "DISABLED") {
    // DO IVR WAITING STUFF
    logger.log("info", {
      timestamp: new Date().toISOString(),
      function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
      message: "Transferring to IVR",
    });
    return res.send(ivrStep1(callRecord._id, setting));
  }
  const twiml = new VoiceResponse();

  // TODO: Check if it goes to voicemail ?
  // Check if agents are available?

  if (setting.greetingMessageStatus !== "DISABLED") {
    // handle the greeting stuff
    logger.log("info", {
      timestamp: new Date().toISOString(),
      function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
      message: "Transferring to grerting",
    });
    if (setting.greetingMessageStatus === "TEXT") {
      twiml.say(setting.greetingMessageInfo);
    } else {
      twiml.play(`https://api.twilio.com/cowbell.mp3`);
    }
    const dial = twiml.dial();
    dial.conference(`conf_${callRecord._id}`);
    return res.send(twiml.toString());
  }

  // For now always go to voicemail

  twiml.say("Hello. Please leave a message after the beep.");

  // Use <Record> to record the caller's message
  twiml.record({
    recordingStatusCallback:
      "https://motiocosolutions.com/api/twillio/incoming/voicemail/" +
      callRecord._id,
    recordingStatusCallbackMethod: "POST",
  });

  // End the call with <Hangup>
  twiml.hangup();

  // Render the response as XML in reply to the webhook request
  return res.send(twiml.toString());

  // TODO :Broadcast on the io that incoming call is coming

  console.log("Default");
  twiml.say("Thank you for calling us. An agent will join in some time.");
  const dial = twiml.dial();
  dial.conference(`conf_${callRecord._id}`);
  return res.send(twiml.toString());
};

export const handleVoiceMailAction = async (req: Request, res: Response) => {
  logger.log("info", {
    timestamp: new Date().toISOString(),
    function: "routers.twillio.utils.incoming.handlers.handleVoiceMailAction",
    message: req.body,
  });
  const callRecordId = req.params.id;
  const voicemailURL = req.body.RecordingUrl;
  const recordingStatus = req.body.RecordingStatus as "completed" | "failed";

  await CallRecordModel.findOneAndUpdate(
    { id: callRecordId },
    {
      voicemailURL: recordingStatus === "completed" ? voicemailURL : "",
      endTime: new Date().getTime(),
    }
  );
  return res.send("OK");
};
