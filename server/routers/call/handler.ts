import { AuthenticatedRequest } from "./../../routes/auth";
import { Response } from "express";
import CallRecordModel from "./../../models/CallRecord";
import {
  INTERNAL_SERVER_ERROR,
  DATA_INCORRECT,
  INCOMPLETE_DATA,
} from "./../../errors";
import { awsKeyExists } from "../../routers/aws/utils";
import logger from "../../logger";
import prisma from "../../prisma";
import { AuthenticatedTypedRequest } from "../../types";

const getTalktime = async (gteDate: Date, companyId: number) => {
  return (
    await prisma.call.findMany({
      where: {
        companyId,
        startedOn: {
          gte: gteDate,
        },
      },
      select: {
        startedOn: true,
        endedOn: true,
      },
    })
  ).reduce((acc, curr) => {
    if (curr.endedOn)
      return curr.endedOn.getTime() - curr.startedOn.getTime() + acc;
    return acc;
  }, 0);
};

export const callDuration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const inboundDuration =
    (
      await prisma.call.findMany({
        where: {
          userId: req.user.id,
          type: "INCOMING",
        },
        select: {
          startedOn: true,
          endedOn: true,
        },
      })
    ).reduce((acc, curr) => {
      if (curr.endedOn)
        return curr.endedOn.getTime() - curr.startedOn.getTime() + acc;
      return acc;
    }, 0) /
    (1000 * 60); // Total in minutes;
  const outgoingDuration =
    (
      await prisma.call.findMany({
        where: {
          userId: req.user.id,
          type: "OUTGOING",
        },
        select: {
          startedOn: true,
          endedOn: true,
        },
      })
    ).reduce((acc, curr) => {
      if (curr.endedOn)
        return curr.endedOn.getTime() - curr.startedOn.getTime() + acc;
      return acc;
    }, 0) /
    (1000 * 60); // Total in minutes;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const date = new Date(currentYear, 0, 1);

  const companyId = parseInt(req.user.companyId);
  const yearTalkTime = await getTalktime(date, companyId);
  const weekDay = new Date().getDay();

  const startWeekDate = new Date().getDay() - weekDay;

  const monthTalktime = await getTalktime(
    new Date(currentYear, currentMonth, 1),
    companyId
  );

  const weekTalktime = await getTalktime(
    new Date(currentYear, currentMonth, startWeekDate),
    companyId
  );

  const todayTalkTime = await getTalktime(
    new Date(currentYear, currentMonth, new Date().getDate()),
    companyId
  );

  return res.json({
    inboundDuration,
    outgoingDuration,
    yearTalkTime,
    monthTalktime,
    weekTalktime,
    todayTalkTime,
  });
};

export const totalCalls = async (req: AuthenticatedRequest, res: Response) => {
  // Details about total calls
  const endTime = new Date().getTime();
  const date = new Date();
  const startTime = date.setHours(0, 0, 0, 0);
  try {
    const inbound = await prisma.call.count({
      where: {
        userId: req.user.id,
        type: "INCOMING",
        startedOn: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
    });

    const inboundTime = (
      await prisma.call.findMany({
        where: {
          userId: req.user.id,
          type: "INCOMING",
          startedOn: {
            gte: new Date(startTime),
            lte: new Date(endTime),
          },
        },
        select: {
          startedOn: true,
          endedOn: true,
        },
      })
    ).reduce((acc, curr) => {
      if (curr.endedOn)
        return curr.endedOn.getTime() - curr.startedOn.getTime() + acc;
      return acc;
    }, 0);

    const outgoing = await prisma.call.count({
      where: {
        userId: req.user.id,
        type: "OUTGOING",
        startedOn: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
    });

    const outgoingTime = (
      await prisma.call.findMany({
        where: {
          userId: req.user.id,
          type: "OUTGOING",
          startedOn: {
            gte: new Date(startTime),
            lte: new Date(endTime),
          },
        },
        select: {
          startedOn: true,
          endedOn: true,
        },
      })
    ).reduce((acc, curr) => {
      if (curr.endedOn)
        return curr.endedOn.getTime() - curr.startedOn.getTime() + acc;
      return acc;
    }, 0);

    const missed = await prisma.call.count({
      where: {
        userId: req.user.id,
        type: "MISSED",
        startedOn: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
    });

    const total = await prisma.call.count({
      where: {
        userId: req.user.id,
        startedOn: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
    });

    const data = {
      inbound,
      outgoing,
      missed,
      total,
      averageMinutes:
        (inboundTime + outgoingTime) / ((inbound + outgoing) * 1000 * 60), // Avg time in minutes
    };
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const callRecordTime = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const startTime = req.body.startTime as number;
    const endTime = req.body.endTime as number;
    if (endTime < startTime) {
      res.status(400).json(DATA_INCORRECT);
    }
    const inbound = await prisma.call.count({
      where: {
        userId: req.user.id,
        type: "INCOMING",
        startedOn: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
    });
    const outgoing = await prisma.call.count({
      where: {
        userId: req.user.id,
        type: "OUTGOING",
        startedOn: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
    });
    const missed = await prisma.call.count({
      where: {
        userId: req.user.id,
        type: "MISSED",
        startedOn: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
    });
    const data = {
      inbound,
      outgoing,
      missed,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const getCallRecordCSID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const callId = req.body.callId;
    if (!callId) {
      res.status(400).json(INCOMPLETE_DATA);
    }

    const callRecord = await CallRecordModel.findById(callId).exec();
    if (!callRecord) {
      res.status(404).json(DATA_INCORRECT);
    }
    res.status(200).json({
      csid: callRecord.callSid,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const getCallRecordFromId = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const id = req.body.id;
  if (!id) {
    return res.json(INCOMPLETE_DATA);
  }
  const data = await CallRecordModel.findById(id).populate("user").exec();
  return res.status(200).json({
    id: data._id,
    callSid: data.callSid,
    isActive: data.isActive,
    startTime: data.startTime,
    endTime: data.endTime,
    from: data.from,
    to: data.to,
    user: {
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      email: data.user.email,
      id: data.user._id,
    },
    type: data.type,
    company: data.company,
  });
};

export const getCallRecordings = async (
  req: AuthenticatedTypedRequest,
  res: Response
) => {
  const companyId = req.user.companyId;

  const calls = await prisma.call.findMany({
    where: {
      companyId,
      status: "ENDED",
    },
    orderBy: {
      startedOn: "desc",
    },
    take: 15,
    include: {
      user: true,
      from: true,
    },
  });

  const data = await Promise.all(
    calls.map(async ({ id, from, to, endedOn, startedOn, user, type }) => {
      const recordingPath = `${companyId}/recordings/${id}.ogg`;
      let exists = false;
      try {
        exists = await awsKeyExists(recordingPath);
      } catch (err) {
        logger.log("error", {
          timestamp: new Date().toISOString(),
          function: "routers.call.handler.getCallRecordings.data.map.callback",
          error: err,
        });
      }

      return {
        id,
        from: from.number,
        to: to,
        duration: endedOn.getTime() - startedOn.getTime(),
        user: {
          id: user.id,
          name: user.firstName,
        },
        startTime: startedOn.getTime(),
        type,
        recordingURL: exists ? recordingPath : null,
      };
    })
  );

  return res.status(200).json(data);
};

export const getCallVoicemails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const companyId = req.user.companyId;

  const callRecords = await CallRecordModel.find({
    company: companyId,
    startTime: {
      $gte: 0,
    },
    endTime: {
      $gte: 0,
    },
    type: {
      $eq: "INCOMING",
    },
  })
    .sort([["startTime", -1]])
    .limit(15)
    .populate("user")
    .exec();

  const data = await Promise.all(
    callRecords.map(async (callRecord) => {
      return {
        id: callRecord._id,
        from: callRecord.from,
        to: callRecord.to,
        duration:
          callRecord.duration || callRecord.endTime - callRecord.startTime,
        user: {
          id: callRecord.user._id,
          name: callRecord.user.firstName,
        },
        startTime: callRecord.startTime,
        type: callRecord.type,
        recordingURL: callRecord.voicemailURL || null,
      };
    })
  );

  return res.status(200).json(data);
};
