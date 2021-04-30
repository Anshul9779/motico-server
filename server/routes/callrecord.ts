// Basic APIs for Call Record
import { DATA_INCORRECT, INTERNAL_SERVER_ERROR } from "./../errors";
import { Response } from "express";
import CallRecordModel from "./../models/CallRecord";
import { AuthenticatedRequest } from "./auth";
import { InternalSymbolName } from "typescript";

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
