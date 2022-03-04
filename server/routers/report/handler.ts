import { AuthenticatedTypedRequest } from "../../types";
import { Response } from "express";
import prisma from "../../prisma";

const day = 24 * 60 * 60 * 1000;

export const userReports = async (
  req: AuthenticatedTypedRequest,
  res: Response
) => {
  const { companyId } = req.user;

  const today = new Date().getTime();
  const monthBack = new Date().getTime() - 30 * day;

  const users = await prisma.user.findMany({
    where: {
      companyId,
    },
    include: {
      calls: {
        where: {
          startedOn: {
            lte: new Date(today),
            gte: new Date(monthBack),
          },
          status: {
            not: "ONGOING",
          },
        },
        select: {
          type: true,
          startedOn: true,
          endedOn: true,
        },
      },
    },
  });

  const json = users
    .map((user) => {
      const { firstName, lastName, id } = user;
      return {
        firstName,
        lastName,
        id,
        calls: user.calls.map((call) => {
          return {
            ...call,
            duration: call.endedOn.getTime() - call.startedOn.getTime(),
          };
        }),
      };
    })
    .map((user) => {
      const calls = user.calls;

      const total = calls.length;
      const moreThan30s = calls.filter(
        (call) => call.duration > 30 * 1000
      ).length;
      const missed = calls.filter((call) => call.type === "MISSED").length;

      return {
        ...user,
        calls: {
          total,
          moreThan30s,
          missed,
        },
      };
    });

  return res.json(json);
};

export const dailyReports = async (
  req: AuthenticatedTypedRequest,
  res: Response
) => {
  const { companyId } = req.user;

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const daysTimeArr = new Array(15).fill(0).map((_, index) => {
    return {
      startDay: start.getTime() - index * day,
      endDay: end.getTime() - index * day,
    };
  });

  const data = await Promise.all(
    daysTimeArr.map(async ({ startDay, endDay }) => {
      const startDate = new Date(startDay);
      const endDate = new Date(endDay);

      const incoming = await prisma.call.count({
        where: {
          type: "INCOMING",
          startedOn: {
            gte: startDate,
            lte: endDate,
          },
          companyId,
        },
      });
      const missed = await prisma.call.count({
        where: {
          type: "MISSED",
          startedOn: {
            gte: startDate,
            lte: endDate,
          },
          companyId,
        },
      });
      const outgoing = await prisma.call.count({
        where: {
          type: "OUTGOING",
          startedOn: {
            gte: startDate,
            lte: endDate,
          },
          companyId,
        },
      });

      return {
        date: startDate.toDateString(),
        incoming,
        missed,
        outgoing,
      };
    })
  );
  return res.json(data);
};
