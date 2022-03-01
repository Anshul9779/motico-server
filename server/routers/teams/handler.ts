import { Response } from "express";
import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "./../../errors";
import { AuthenticatedTypedRequest } from "../../types";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma";

export const createTeam = async (
  req: AuthenticatedTypedRequest<
    Prisma.TeamCreateInput & {
      userIds?: number[];
      phonenumber?: number;
    }
  >,
  res: Response
) => {
  try {
    const payload = req.body;
    if (!payload.name) {
      return res.sendStatus(400).json(INCOMPLETE_DATA);
    }
    const { callType, name, userIds, phonenumber } = req.body;
    const { companyId } = req.user;

    const hasNumber = Boolean(phonenumber);

    const team = await prisma.team.create({
      data: {
        name,
        callType,
        users: {
          connect: userIds?.map((id) => ({ id })) ?? [],
        },
        phoneNumber: hasNumber
          ? {
              connect: {
                id: phonenumber,
              },
            }
          : {},
        company: {
          connect: {
            id: companyId,
          },
        },
      },
    });
    return res.json({
      ...team,
    });
  } catch (error) {
    console.log(`routers.teams.createTeam ${error}`);
    return res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const deleteTeam = async (
  req: AuthenticatedTypedRequest<{ id: number }>,
  res: Response
) => {
  const { id } = req.body;
  if (!id) {
    res.sendStatus(400).json(INCOMPLETE_DATA);
  }
  await prisma.team.delete({
    where: { id },
  });
  return res.sendStatus(200).send("Deleted");
};

export const getTeams = async (
  req: AuthenticatedTypedRequest,
  res: Response
) => {
  const {
    user: { companyId },
  } = req;

  const teams = await prisma.team.findMany({
    where: {
      companyId,
    },
    include: {
      users: true,
    },
  });

  return res.json(teams);
};

export const getTeam = async (
  req: AuthenticatedTypedRequest<{}, {}, { id: string }>,
  res: Response
) => {
  const team = await prisma.team.findUnique({
    where: {
      id: parseInt(req.params.id, 10),
    },
  });
  return res.json(team);
};
