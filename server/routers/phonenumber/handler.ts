import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "./../../errors";
import { Response } from "express";
import logger from "../../logger";
import { AuthenticatedTypedRequest } from "../../types";
import {
  AssignPhoneNumberFnPN,
  AssignPhoneNumberFnTeam,
  AssignPhoneNumberFnUser,
  assignPhonenumberGeneric,
} from "../../utils/phonenumber";
import prisma from "../../prisma";
import { Prisma } from "@prisma/client";

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

export const assignPhoneNumber = async (
  req: AuthenticatedTypedRequest<
    AssignPhoneNumberFnUser | AssignPhoneNumberFnTeam | AssignPhoneNumberFnPN,
    undefined
  >,
  res: Response
) => {
  return res.json({
    message: "API NOT IMPLEMENTED",
  });
  try {
    if (!req.body.type) {
      return res.json({
        ...INCOMPLETE_DATA,
        message: "You are using old API, update",
      });
    }
    await assignPhonenumberGeneric(req.body);
    return res.json({
      message: "OK",
    });
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
  req: AuthenticatedTypedRequest<
    Prisma.PhoneNumberSettingsUpdateInput,
    {},
    { id: string }
  >,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10);

    const updatedSettings = await prisma.phoneNumberSettings.update({
      where: {
        phoneNumberId: id,
      },
      data: req.body,
    });

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
