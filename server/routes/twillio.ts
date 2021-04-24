import { Response, Request, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import config from "./../config";
import twilio from "twilio";
import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "./../errors";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import CallRecordModel from "./../models/CallRecord";

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
export const twillioConnect = (req: Request, res: Response) => {
  const phoneNumber = req.body.to;
  const callerId = req.body.from;
  const twiml = new VoiceResponse();

  const dial = twiml.dial({ callerId });
  dial.number({}, phoneNumber);
  res.send(twiml.toString());
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
      type: "INCOMING",
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
