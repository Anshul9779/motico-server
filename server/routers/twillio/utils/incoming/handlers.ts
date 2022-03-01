// Handles the incoming call stuff
import { Response } from "express";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { ivrStep1 } from "./ivr";
import logger from "../../../../logger";
import { TypedRequest } from "../../../../types";
import prisma from "../../../../prisma";

export const handleIncomingCall = async (
  req: TypedRequest<{ To: string; From: string }>,
  res: Response
) => {
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

  const { To: to } = req.body;

  const phoneNumber = await prisma.phoneNumber.findUnique({
    where: {
      number: to,
    },
    include: {
      settings: true,
      users: true,
    },
  });
  if (!phoneNumber) {
    return res.send("ERR");
  }

  const { settings } = phoneNumber;
  logger.log("info", {
    timestamp: new Date().toISOString(),
    function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
    message: settings,
  });

  if (!settings) {
    logger.log("info", {
      timestamp: new Date().toISOString(),
      function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
      message: "Settings not created for " + phoneNumber.number,
    });
    return res.status(500).send("ERR");
  }

  // Start a Call Record and Return the ID;
  // const callRecord = await CallRecordModel.create(callRecordDetails);
  const call = await prisma.call.create({
    data: {
      to,
      type: "INCOMING",
      status: "ONGOING",
      from: {
        connect: {
          id: phoneNumber.id,
        },
      },
      startedOn: new Date(),
      companyId: phoneNumber.companyId,
    },
  });
  res.type("text/xml");
  // Number 1. IVR
  if (settings.ivrEnabled) {
    // DO IVR WAITING STUFF
    logger.log("info", {
      timestamp: new Date().toISOString(),
      function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
      message: "Transferring to IVR",
    });
    return res.send(ivrStep1(call.id, settings));
  }
  const twiml = new VoiceResponse();

  // TODO: Check if it goes to voicemail ?
  // Check if agents are available?

  if (settings.greetingMsgStatus !== "DISABLED") {
    // handle the greeting stuff
    logger.log("info", {
      timestamp: new Date().toISOString(),
      function: "routers.twillio.utils.incoming.handlers.handleIncomingCall",
      message: "Transferring to grerting",
    });
    if (settings.greetingMsgStatus === "TEXT") {
      twiml.say(settings.greetingMsgStatus);
    } else {
      twiml.play(`https://api.twilio.com/cowbell.mp3`);
    }
    const dial = twiml.dial();
    dial.conference(`conf_${call.id}`);
    return res.send(twiml.toString());
  }

  // For now always go to voicemail

  twiml.say("Hello. Please leave a message after the beep.");

  // Use <Record> to record the caller's message
  twiml.record({
    recordingStatusCallback:
      "https://motiocosolutions.com/api/twillio/incoming/voicemail/" + call.id,
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
  dial.conference(`conf_${call.id}`);
  return res.send(twiml.toString());
};

export const handleVoiceMailAction = async (
  req: TypedRequest<
    {
      RecordingUrl: string;
      RecordingStatus: "completed" | "failed";
    },
    {},
    { id: string }
  >,
  res: Response
) => {
  logger.log("info", {
    timestamp: new Date().toISOString(),
    function: "routers.twillio.utils.incoming.handlers.handleVoiceMailAction",
    message: req.body,
  });
  const callId = req.params.id;
  const voicemailURL = req.body.RecordingUrl;
  const recordingStatus = req.body.RecordingStatus as "completed" | "failed";

  await prisma.call.update({
    where: {
      id: parseInt(callId, 10),
    },
    data: {
      recordedURL: recordingStatus === "completed" ? voicemailURL : "",
      endedOn: new Date(),
    },
  });
  return res.send("OK");
};
