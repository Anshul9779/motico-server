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

/**
 * Twillio Call Connect
 *
 * [`POST`]
 *
 */
export const twillioConnect = async (req: Request, res: Response) => {
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

  // If ID is correct then mutate the data
  await CallRecordModel.findOneAndUpdate(
    { _id: callRecordID },
    { startTime: new Date().getTime() }
  );

  // Refer https://stackoverflow.com/a/41063359/8077711

  // By default all the call are conf calls.
  // Conference Room name is the same as callRecordID
  // Admin will join the conf while agent and user would be talking

  const twiml = new VoiceResponse();

  if (isAdmin === "false") {
    // Agent and User
    const dial = twiml.dial({ callerId });
    dial.conference(`${callRecordID}`);
    dial.number({}, phoneNumber);
    res.send(twiml.toString());
  } else {
    // Moderator barges in
    const dial = twiml.dial({ callerId: ADMIN_NUMBER });
    dial.conference(`${callRecordID}`);
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
