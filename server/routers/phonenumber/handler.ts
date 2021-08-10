import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "./../../errors";
import { Response } from "express";
import { AuthenticatedRequest } from "./../../routes/auth";
import PhoneNumber from "./../../models/PhoneNumber";
import NumberSetting from "./../../models/NumberSettings";
import UserModel from "./../../models/User";

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
  req: AuthenticatedRequest,
  res: Response
) => {
  const phoneNumberIds: string[] = req.body.phoneNumberIds;
  const userId = req.body.userId;
  await UserModel.findByIdAndUpdate(userId, {
    phoneNumbers: phoneNumberIds,
  }).exec();
  await Promise.all(
    phoneNumberIds.map(async (phoneId) => {
      const phoneData = await PhoneNumber.findById(phoneId).exec();
      if (!phoneData.assignedTo.includes(userId)) {
        phoneData.assignedTo.push(userId);
      }
      await phoneData.save();
    })
  );
  return res.json({
    message: "OK",
  });
};
