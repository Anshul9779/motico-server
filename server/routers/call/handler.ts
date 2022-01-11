import { AuthenticatedRequest } from "./../../routes/auth";
import { Response } from "express";
import CallRecordModel from "./../../models/CallRecord";
import {
  INTERNAL_SERVER_ERROR,
  DATA_INCORRECT,
  INCOMPLETE_DATA,
} from "./../../errors";

export const callDuration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  console.log("Called");
  const inbound = await CallRecordModel.find({
    company: req.user.companyId,
    type: "INCOMING",
    duration: {
      $gt: 0,
    },
  }).exec();
  const inboundDuration =
    inbound.reduce((prev, curr) => prev + curr.duration, 0) / (1000 * 60); // Total in minutes
  const outgoing = await CallRecordModel.find({
    company: req.user.companyId,
    type: "OUTGOING",
    duration: {
      $gt: 0,
    },
  }).exec();
  const outgoingDuration =
    outgoing.reduce((prev, curr) => prev + curr.duration, 0) / (1000 * 60); // Total in minutes
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const date = new Date(currentYear, 0, 1);
  const yearTalkTime = (
    await CallRecordModel.find({
      company: req.user.companyId,
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: date.getTime(),
      },
    }).exec()
  ).reduce((prev, curr) => prev + curr.duration, 0);
  const weekDay = new Date().getDay();
  const startWeekDate = new Date().getDay() - weekDay;
  const monthTalktime = (
    await CallRecordModel.find({
      company: req.user.companyId,
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: new Date(currentYear, currentMonth, 1).getTime(),
      },
    }).exec()
  ).reduce((prev, curr) => {
    console.log(curr._id);
    return prev + curr.duration;
  }, 0);

  const weekTalktime = (
    await CallRecordModel.find({
      company: req.user.companyId,
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: new Date(currentYear, currentMonth, startWeekDate).getTime(),
      },
    }).exec()
  ).reduce((prev, curr) => {
    console.log(curr._id);
    return prev + curr.duration;
  }, 0);

  const todayTalkTime = (
    await CallRecordModel.find({
      company: req.user.companyId,
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: new Date(
          currentYear,
          currentMonth,
          new Date().getDate()
        ).getTime(),
      },
    }).exec()
  ).reduce((prev, curr) => {
    console.log(curr._id);
    return prev + curr.duration;
  }, 0);

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
    const inbound = await CallRecordModel.find({
      user: req.user.id,
      type: "INCOMING",
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: startTime,
        $lte: endTime,
      },
    })
      .count()
      .exec();
    const inboundTime = (
      await CallRecordModel.find({
        user: req.user.id,
        type: "INCOMING",
        duration: {
          $gt: 0,
        },
        startTime: {
          $gte: startTime,
          $lte: endTime,
        },
      }).exec()
    ).reduce((acc, curr) => acc + curr.duration, 0);
    const outgoing = await CallRecordModel.find({
      user: req.user.id,
      type: "OUTGOING",
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: startTime,
        $lte: endTime,
      },
    })
      .count()
      .exec();
    const outgoingTime = (
      await CallRecordModel.find({
        user: req.user.id,
        type: "OUTGOING",
        duration: {
          $gt: 0,
        },
        startTime: {
          $gte: startTime,
          $lte: endTime,
        },
      }).exec()
    ).reduce((acc, curr) => acc + curr.duration, 0);
    const missed = await CallRecordModel.find({
      user: req.user.id,
      type: "MISSED",
      startTime: {
        $gte: startTime,
        $lte: endTime,
      },
    })
      .count()
      .exec();
    const total = await CallRecordModel.find({
      user: req.user.id,
      duration: {
        $gt: 0,
      },
    })
      .count()
      .exec();
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
    const inbound = await CallRecordModel.find({
      user: req.user.id,
      type: "INCOMING",
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: startTime,
        $lte: endTime,
      },
    })
      .count()
      .exec();
    const outgoing = await CallRecordModel.find({
      user: req.user.id,
      type: "OUTGOING",
      duration: {
        $gt: 0,
      },
      startTime: {
        $gte: startTime,
        $lte: endTime,
      },
    })
      .count()
      .exec();
    const missed = await CallRecordModel.find({
      user: req.user.id,
      type: "MISSED",
      startTime: {
        $gte: startTime,
        $lte: endTime,
      },
    })
      .count()
      .exec();
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
  console.log({ data });
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
