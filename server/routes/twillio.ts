import { Response, Request, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import config from "./../config";
import twilio from "twilio";
import {
  DATA_INCORRECT,
  INCOMPLETE_DATA,
  INTERNAL_SERVER_ERROR,
} from "./../errors";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import CallRecordModel from "./../models/CallRecord";

const ADMIN_NUMBER = "+18582424792";
const NGROK_URL = "http://58214685f13c.ngrok.io";

/**
 * How to start a phone call?
 * First Get the token -> Token is valid for a 1hr only, Refresh the token in 30 -45 mins
 * If you want to dial a number -> Hit the start outgoing endpoint -> Recive the CallRecord ID ->
 * Hit the connect API with the from, to, and the CallRecord ID, when call is connected the startTime, endTime
 * and duration are calculated and updated on disconnecting the call.
 */

const { AccessToken } = twilio.jwt;
const VoiceGrant = AccessToken.VoiceGrant;
const client = twilio(config.accountSid, config.authToken);

/**
 * Twillo Token
 *
 * [`GET`, `Protected`]
 *
 */
export const twillioToken = (req: AuthenticatedRequest, res: Response) => {
  try {
    const accessToken = new AccessToken(
      config.accountSid,
      config.keySid,
      config.secret
    );
    accessToken.identity = req.user.firstName;
    const grant = new VoiceGrant({
      outgoingApplicationSid: config.outgoingApplicationSid,
      incomingAllow: true,
    });
    accessToken.addGrant(grant);
    return res.status(201).json({ token: accessToken.toJwt() });
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const twillioConfTwiML = async (req: Request, res: Response) => {
  const callRecordID = req.params.sid;
  console.log("Conf HIT", req.params, req.body);
  const seqNum = req.body.SequenceNumber;
  if (seqNum === "1") {
    await client
      .conferences("conf_" + callRecordID)
      .participants.create({
        to: req.params.phone,
        from: req.params.callerId,
        earlyMedia: true,
        endConferenceOnExit: true,
      })
      .then((participant) => {
        res.status(200).end();
      })
      .catch((error) => {
        console.error(error);
        res.status(500).end();
      });
  }
};

/**
 * Twillio Call Connect
 *
 * [`POST`]
 *
 */
export const twillioConnect = async (req: Request, res: Response) => {
  console.log(req.body);
  const phoneNumber = req.body.to;
  const callerId = req.body.from;
  const callRecordID = req.body.callRecordID;
  const isAdmin = req.body.isAdmin;
  // Here check if the ID is correct or not
  const callRecord = await CallRecordModel.findOne({
    _id: callRecordID,
  }).exec();
  if (!callRecord) {
    res.send(400).json(DATA_INCORRECT);
  }
  if (isAdmin === "false") {
    // If ID is correct then mutate the data
    await CallRecordModel.findOneAndUpdate(
      { _id: callRecordID },
      { startTime: new Date().getTime() }
    );
  }

  // Refer https://stackoverflow.com/a/41063359/8077711

  // By default all the call are conf calls.
  // Conference Room name is the same as callRecordID
  // Admin will join the conf while agent and user would be talking

  const twiml = new VoiceResponse();

  if (isAdmin === "false") {
    // Agent and User
    let name = "conf_" + callRecordID;

    const twiml = new twilio.twiml.VoiceResponse();
    // Get the calledID from configuration.json
    const dial = twiml.dial({ callerId });

    dial.conference(
      {
        endConferenceOnExit: true,
        statusCallbackEvent: ["join"],
        statusCallback: `/api/twillio/call/${callRecordID}/add-participant/${encodeURIComponent(
          callerId
        )}/${encodeURIComponent(phoneNumber)}`,
      },
      name
    );
    res.set({
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0",
    });
    res.send(twiml.toString());
  } else {
    // Convert Existing call to conf call.
    console.log("Call SID", callRecord.callSid);
    // await client.calls(callRecord.callSid).update({
    //   url: `${NGROK_URL}/api/twillio/confTwiML?callId=${callRecordID}`,
    //   method: "GET",
    // });
    // console.log("Updated");
    // Moderator barges in
    const dial = twiml.dial();
    console.log("Admin joingin conf", callRecordID);
    dial.conference({ muted: true, beep: "false" }, `conf_${callRecordID}`);
    res.type("text/xml");
    res.send(twiml.toString());
  }
};

export const twillioCallStart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const payload = req.body;
  if (!payload.from || !payload.to) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const callRecordDetails = {
      from: payload.from,
      to: payload.to,
      user: req.user.id,
      type: "OUTGOING",
      isActive: true,
      company: req.user.companyId,
      callSid: "",
    };
    // Start a Call Record and Return the ID;
    const callRecord = await CallRecordModel.create(callRecordDetails);
    return res.status(201).json({
      callRecordID: callRecord._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};
