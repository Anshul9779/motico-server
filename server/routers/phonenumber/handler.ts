import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "./../../errors";
import { Response } from "express";
import logger from "../../logger";
import { AuthenticatedTypedRequest } from "../../types";
import prisma from "../../prisma";
import { PhoneNumber, PhoneNumberSettings, Prisma, User } from "@prisma/client";

export const getCompanyPhoneNumbers = async (
  req: AuthenticatedTypedRequest,
  res: Response
) => {
  try {
    const { companyId } = req.user;
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        companyId,
      },
      include: {
        settings: true,
        users: true,
      },
    });
    return res.json(phoneNumbers);
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const addNumber = async (
  req: AuthenticatedTypedRequest<
    Omit<Prisma.PhoneNumberCreateInput, "purchasedOn" | "">
  >,
  res: Response
) => {
  try {
    const { name, cost, twillioId, number, country, area } = req.body;
    if (!(name && cost && twillioId && number && country && area)) {
      return res.status(400).json(INCOMPLETE_DATA);
    } else {
      const { companyId } = req.user;
      const phoneNumber = await prisma.phoneNumber.create({
        data: {
          ...req.body,
          purchasedOn: new Date(),
          company: {
            connect: {
              id: companyId,
            },
          },
          settings: {
            create: {
              documentStatus: "VERIFIED",
              greetingMsgStatus: "DISABLED",
              ivrData: {},
              voicemailStatus: "DISABLED",
            },
          },
        },
        include: {
          settings: true,
        },
      });
      res.status(201).json(phoneNumber);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

type UsersAssign = {
  type: "users";
  ids: number[];
};

type TeamAssign = {
  type: "team";
  id: number;
};

export const assignPhoneNumber = async (
  req: AuthenticatedTypedRequest<UsersAssign | TeamAssign, {}, { id: string }>,
  res: Response
) => {
  try {
    const data = req.body;
    const id = parseInt(req.params.id, 10);

    const { type } = data;

    if (data.type === "users") {
      const { ids } = data;

      await prisma.phoneNumber.update({
        where: {
          id,
        },
        data: {
          team: {
            disconnect: true,
          },
          users: {
            set: ids.map((i) => ({
              id: i,
            })),
          },
        },
      });
      return res.send("OK");
    }
    if (data.type === "team") {
      const teamId = data.id;

      await prisma.phoneNumber.update({
        where: {
          id,
        },
        data: {
          users: {
            set: [],
          },
          team: {
            connect: {
              id: teamId,
            },
          },
        },
      });
      return res.send("OK");
    }

    return res.status(400).send("Incorrect type");
  } catch (error) {
    console.error(error);
    return res.json(INTERNAL_SERVER_ERROR);
  }
};

export const getNumberSettings = async (
  req: AuthenticatedTypedRequest<{}, {}, { id: string }>,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);

  const settings = await prisma.phoneNumberSettings.findUnique({
    where: { id },
    include: {
      phoneNumber: true,
    },
  });

  return res.json(settings);
};

export const updateNumberSetting = async (
  req: AuthenticatedTypedRequest<PhoneNumberSettings, {}, { id: string }>,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10);

    const updatedSettings = await prisma.phoneNumberSettings.update({
      where: {
        phoneNumberId: id,
      },
      data: req.body,
      include: {
        phoneNumber: true,
      },
    });

    if (updatedSettings.ivrEnabled) {
      // If IVR Enabled, disconnect team and users
      await prisma.phoneNumber.update({
        where: {
          id,
        },
        data: {
          users: {
            set: [],
          },
          team: {
            disconnect: true,
          },
        },
      });
    }

    return res.json(updatedSettings);
  } catch (e) {
    logger.log("error", {
      timestamp: new Date().toISOString(),
      function: "routers.phonenumber.handler.updateNumberSetting",
      error: e,
    });
    return res.status(500);
  }
};

export const getPhonenumber = async (
  req: AuthenticatedTypedRequest<{}, {}, { id: string }>,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);
  const data = await prisma.phoneNumber.findUnique({
    where: { id },
    include: {
      settings: true,
      users: true,
      team: true,
    },
  });
  const safeData = {
    ...data,
    users: data.users.map(({ password, ...user }) => user),
  };
  return res.json(safeData);
};
