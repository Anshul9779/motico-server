import {
  DATA_INCORRECT,
  INCOMPLETE_DATA,
  INTERNAL_SERVER_ERROR,
} from "./../../../errors";
import { Response } from "express";
import { AuthenticatedRequest } from "./../../../routes/auth";
import twilio from "twilio";
import config from "./../../../config";
import PhoneNumberModel from "./../../../models/PhoneNumber";

const { AccessToken } = twilio.jwt;
const VoiceGrant = AccessToken.VoiceGrant;
const client = twilio(config.accountSid, config.authToken);

export const buyNumber = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber, name, country, area } = req.body;
    if (!phoneNumber || !name || !country || !area) {
      return res.status(400).json(INCOMPLETE_DATA);
    }

    // TODO: Check if phone number only contains numbers and plus sign

    const companyId = req.user.companyId;

    // First register number on Twillio
    const incomingPhoneNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
    });
    // Create a new Phone Number;
    const companyPhoneNumber = await PhoneNumberModel.create({
      name,
      cost: 1,
      company: companyId,
      purchasedOn: new Date().getTime(),
      twillioId: incomingPhoneNumber.sid,
      assignedTo: [],
      number: phoneNumber,
      country,
      area,
      isRecording: false,
      voiceMail: false,
      available: true,
    });

    // Return the phone number instance

    res.status(201).json(companyPhoneNumber);
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const getAvailablePhoneNumbers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { country, type } = req.body;
    // Atleast country name should be there
    if (!country || !type) {
      return res.status(400).json(INCOMPLETE_DATA);
    }
    if (country.length > 2) {
      return res.status(400).json(DATA_INCORRECT);
    }
    // depending on the type fetch accordingly
    const areaCode = req.body.areaCode;
    const region = req.body.region;
    if (type === "LOCAL") {
      try {
        const numbers = await client
          .availablePhoneNumbers(country)
          .local.list({ areaCode, limit: 20, inRegion: region });
        return res.status(200).json(numbers);
      } catch (error) {
        console.error(error);
        return res.send(500).json(INTERNAL_SERVER_ERROR);
      }
    } else if (type === "TOLLFREE") {
      try {
        const numbers = await client
          .availablePhoneNumbers(country)
          .tollFree.list({ areaCode, limit: 20, inRegion: region });
        return res.status(200).json(numbers);
      } catch (error) {
        console.error(error);
        return res.send(500).json(INTERNAL_SERVER_ERROR);
      }
    } else if (type === "MOBILE") {
      try {
        const numbers = await client
          .availablePhoneNumbers(country)
          .mobile.list({ areaCode, limit: 20, inRegion: region });
        return res.status(200).json(numbers);
      } catch (error) {
        console.error(error);
        return res.send(500).json(INTERNAL_SERVER_ERROR);
      }
    } else {
      return res.status(400).json(DATA_INCORRECT);
    }
  } catch (error) {
    console.error(error);
    res.send(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const twillioToken = (req: AuthenticatedRequest, res: Response) => {
  try {
    const accessToken = new AccessToken(
      config.accountSid,
      config.keySid,
      config.secret
    );
    accessToken.identity = req.user.firstName;
    const grant = new VoiceGrant({
      outgoingApplicationSid: config.outgoingApplicationSid,
      incomingAllow: true,
    });
    accessToken.addGrant(grant);
    return res.status(201).json({ token: accessToken.toJwt() });
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};
