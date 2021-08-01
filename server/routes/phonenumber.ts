import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "../errors";
import { Response } from "express";
import PhoneNumber from "../models/PhoneNumber";
import { AuthenticatedRequest } from "./auth";

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
