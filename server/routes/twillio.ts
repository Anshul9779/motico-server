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
import PhoneNumberModel from "./../models/PhoneNumber";

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
      .then(() => {
        res.status(200).end();
      })
      .catch((error: Error) => {
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
  const isIncoming = req.body.isIncoming;
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
  if (isIncoming && isIncoming === "true") {
    const dial = twiml.dial();
    console.log("Incoming joingin conf", callRecordID);
    dial.conference(`conf_${callRecordID}`);
    res.type("text/xml");
    return res.send(twiml.toString());
  }
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
    return res.send(twiml.toString());
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
    dial.conference({ beep: "false" }, `conf_${callRecordID}`);
    res.type("text/xml");
    return res.send(twiml.toString());
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

export const getAvailablePhoneNumbers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { country, type } = req.body;
    // Atleast country name should be there
    if (!country || !type) {
      return res.status(400).json(INCOMPLETE_DATA);
    }
    if (country.length > 2) {
      return res.status(400).json(DATA_INCORRECT);
    }
    // depending on the type fetch accordingly
    const areaCode = req.body.areaCode;
    const region = req.body.region;
    if (type === "LOCAL") {
      const numbers = await client
        .availablePhoneNumbers(country)
        .local.list({ areaCode, limit: 20, inRegion: region });
      return res.status(200).json(numbers);
    } else if (type === "TOLLFREE") {
      const numbers = await client
        .availablePhoneNumbers(country)
        .tollFree.list({ areaCode, limit: 20, inRegion: region });
      return res.status(200).json(numbers);
    } else if (type === "MOBILE") {
      const numbers = await client
        .availablePhoneNumbers(country)
        .mobile.list({ areaCode, limit: 20, inRegion: region });
      return res.status(200).json(numbers);
    } else {
      return res.status(400).json(DATA_INCORRECT);
    }
  } catch (error) {
    console.error(error);
    res.send(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const buyNumber = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber, name, country, area } = req.body;
    if (!phoneNumber || !name || !country || !area) {
      return res.status(400).json(INCOMPLETE_DATA);
    }

    // TODO: Check if phone number only contains numbers and plus sign

    const companyId = req.user.companyId;

    // First register number on Twillio
    const incomingPhoneNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
    });
    // Create a new Phone Number;
    const companyPhoneNumber = await PhoneNumberModel.create({
      name,
      cost: 1,
      company: companyId,
      purchasedOn: new Date().getTime(),
      twillioId: incomingPhoneNumber.sid,
      assignedTo: [],
      number: phoneNumber,
      country,
      area,
      isRecording: false,
      voiceMail: false,
      available: true,
    });

    // Return the phone number instance

    res.status(201).json(companyPhoneNumber);
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

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

const terminateCall = () => {
  const twiml = new VoiceResponse();
  twiml.say("Thank you for calling. We are hanging up now!");
  twiml.hangup();
  return twiml.toString();
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

export const handleIncomingCall = async (req: Request, res: Response) => {
  console.log("Incoming", req.body);
  const phoneNumber = await PhoneNumberModel.findOne({
    number: req.body.To,
  }).exec();
  const twiml = new VoiceResponse();
  const callRecordDetails = {
    from: req.body.From,
    to: req.body.To,
    type: "INCOMING",
    isActive: true,
    company: phoneNumber.company,
    callSid: "",
  };
  // Start a Call Record and Return the ID;
  const callRecord = await CallRecordModel.create(callRecordDetails);
  twiml.say("Thank you for calling us. An agent will join in some time.");
  const dial = twiml.dial();
  dial.conference(`conf_${callRecord._id}`);
  return res.send(twiml.toString());
};

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
