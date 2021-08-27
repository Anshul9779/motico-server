import { Response, Request } from "express";
import { AuthenticatedRequest } from "./auth";

import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import CallRecordModel from "./../models/CallRecord";
import { terminateCall } from "./../routers/twillio/utils/incoming/utils";
/**
 * Twillio Call Connect
 *
 * [`POST`]
 *
 */

export const ivrWelcome = async (req: Request, res: Response) => {
  console.log(req.body);
  const voiceReponse = new VoiceResponse();

  const gather = voiceReponse.gather({
    action: "/ivr/menu",
    numDigits: 1,
    method: "POST",
  });

  gather.say(
    "Thanks for calling Motico Solutions. This is test for IVR Services. Press 1 for calling our sales guy. Press 2 for cutting this call after a different message"
  );
  return res.send(voiceReponse.toString());
};

export const ivrMenu = async (req: Request, res: Response) => {
  console.log(req.body);
  const digit = req.body.digits || req.body.Digits;
  if (digit === "1") {
    const twiml = new VoiceResponse();
    twiml.dial("+18564153631");
    return res.send(twiml.toString());
  } else if (digit === "2") {
    const twiml = new VoiceResponse();
    twiml.say(
      "Motico Solutions provides Voice Over Internet Protocol Services."
    );
    twiml.say(
      "Thank you for calling Motico Solutioncs. We are now hanging up!"
    );
    return res.send(twiml.toString());
  } else res.send(terminateCall());
};

// Handle Incoming Call->
/**
 *
 * By default, when the call comes, add the user to a conference.
 * Then, when Agents wants to join  the call-> Add agent to conference.
 *
 * In Incoming Calls, from would be incoming number and to would be agents number;
 *
 */

export const getPendingIncomingCalls = (
  req: AuthenticatedRequest,
  res: Response
) => {
  const number = req.body.phoneNumber;
  const pendingCalls = CallRecordModel.find({
    from: number,
    type: "INCOMING",
    isActive: true,
  });
  res.sendStatus(200).json(
    pendingCalls.map((call) => {
      return {
        callRecordId: call._id,
      };
    })
  );
};
