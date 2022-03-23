import {
  DATA_INCORRECT,
  INCOMPLETE_DATA,
  INTERNAL_SERVER_ERROR,
} from "./../../../../errors";
import { Response } from "express";
import twilio from "twilio";
import config from "./../../../../config";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { getIO } from "../../../../sockets";
import SOCKET from "../../../../sockets/channels";
import { AuthenticatedTypedRequest, TypedRequest } from "../../../../types";
import prisma from "../../../../prisma";

const client = twilio(config.accountSid, config.authToken);

export const getCallRecordID = async (
  req: AuthenticatedTypedRequest<{
    from: string;
    to: string;
  }>,
  res: Response
) => {
  const { from, to } = req.body;
  if (!from || !to) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const { id: userId, companyId } = req.user;
    const call = await prisma.call.create({
      data: {
        from: {
          connect: {
            number: from,
          },
        },
        to,
        type: "OUTGOING",
        status: "ONGOING",
        user: {
          connect: {
            id: userId,
          },
        },
        companyId,
      },
    });
    return res.status(201).json({
      callRecordID: call.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const confConnect = async (
  req: TypedRequest<
    { SequenceNumber: string },
    {},
    { sid: string; phone: string; callerId: string }
  >,
  res: Response
) => {
  const { sid: callRecordID, phone, callerId } = req.params;
  const { SequenceNumber: seqNum } = req.body;

  console.log("Conf HIT", req.params, req.body);
  if (seqNum === "1") {
    await client
      .conferences("conf_" + callRecordID)
      .participants.create({
        to: phone,
        from: callerId,
        earlyMedia: true,
        endConferenceOnExit: true,
      })
      .then((d) => {
        res.status(200).end();
      })
      .catch((error: Error) => {
        console.error(error);
        res.status(500).end();
      });
  }
};

export const outgoingStart = async (
  req: TypedRequest<{
    to: string;
    from: string;
    isAdmin: "true" | "false";
    callRecordID: string;
    isIncoming: "true" | "false";
    CallSid: string;
  }>,
  res: Response
) => {
  const {
    to: phoneNumber,
    from: callerId,
    callRecordID,
    isAdmin,
    isIncoming,
    CallSid,
  } = req.body;

  const id = parseInt(callRecordID, 10);

  // Here check if the ID is correct or not
  const call = await prisma.call.findUnique({
    where: { id },
  });

  if (!call) {
    res.send(400).json(DATA_INCORRECT);
  }
  if (isAdmin === "false" || !call.startedOn) {
    // If ID is correct then mutate the data
    await prisma.call.update({
      where: { id },
      data: {
        startedOn: new Date(),
        sid: CallSid,
      },
    });
    const io = getIO();
    io.to(`admin-${call.companyId}`).emit(SOCKET.CALL_ADD, {
      id: callRecordID,
    });
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
        statusCallback: `/api/twillio/outgoing/conf/${callRecordID}/add-participant/${encodeURIComponent(
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
    console.log("Call SID", call.sid);
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

export const endCallInDb = async (
  req: AuthenticatedTypedRequest<{ callId: number }>,
  res: Response
) => {
  const { callId } = req.body;
  // Here check if the ID is correct or not
  console.log("Ending the call", callId);
  const call = await prisma.call.update({
    where: {
      id: callId,
    },
    data: {
      endedOn: new Date(),
      status: "ENDED",
    },
  });
  const io = getIO();
  io.to(`admin-${call.companyId}`).emit(SOCKET.CALL_END, {
    id: call.id,
  });
  return res.send({ message: "OK" });
};
