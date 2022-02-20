import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "./../../errors";
import { Response } from "express";
import { AuthenticatedRequest } from "./../../routes/auth";
import PhoneNumber from "./../../models/PhoneNumber";
import NumberSetting from "./../../models/NumberSettings";
import UserModel from "./../../models/User";
import logger from "../../logger";
import { AuthenticatedTypedRequest } from "../../types";
import {
  AssignPhoneNumberFnPN,
  AssignPhoneNumberFnTeam,
  AssignPhoneNumberFnUser,
  assignPhonenumberGeneric,
} from "../../utils/phonenumber";

export const getRegisteredPhoneNumbers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const companyId = req.user.companyId;
    const phoneNumbers = await PhoneNumber.find({ company: companyId }).exec();
    res.status(200).json(phoneNumbers);
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const addNumber = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, cost, company, twillioId, number, country, area } = req.body;
    if (!(name && cost && company && twillioId && number && country && area)) {
      return res.status(400).json(INCOMPLETE_DATA);
    } else {
      const phoneNumber = await PhoneNumber.create({
        name,
        cost,
        company,
        purchasedOn: new Date().getTime(),
        twillioId,
        assignedTo: [],
        number,
        country,
        area,
        isRecording: false,
        voiceMail: false,
        available: true,
      });
      // After creating the number, create the settings also
      await NumberSetting.create({
        phoneNumber: phoneNumber._id,
        canRecord: false,
        canPause: false,
        documentStatus: "VERIFIED",
        greetingMessageStatus: "DISABLED",
        voiceMailStatus: "DISABLED",
        ivrStatus: "DISABLED",
        callQueing: true,
      });
      res.status(201).json(phoneNumber);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};
/**
 * Request Body should be
 * {
 *    audioKey : s3 bucket key
 *    text : string
 * }
 */

export const addGreetingMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { text, audioKey } = req.body;

  if (!text || !audioKey) {
    return res.json(INCOMPLETE_DATA);
  }
};

export const assignPhoneNumber = async (
  req: AuthenticatedTypedRequest<
    AssignPhoneNumberFnUser | AssignPhoneNumberFnTeam | AssignPhoneNumberFnPN,
    undefined
  >,
  res: Response
) => {
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
  req: AuthenticatedRequest,
  res: Response
) => {
  const number = req.body.number;
  const setting = await (
    await NumberSetting.findOne({ phoneNumber: number })
  )
    // @ts-ignore
    .execPopulate("phoneNumber");
  return res.send(setting);
};

export const updateNumberSetting = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const id = req.body.setting._id;
    await NumberSetting.findOneAndUpdate({ _id: id }, req.body.setting).exec();
    return res.send("Updated");
  } catch (e) {
    logger.log("error", {
      timestamp: new Date().toISOString(),
      function: "routers.phonenumber.handler.updateNumberSetting",
      error: e,
    });
    return res.status(500);
  }
};
