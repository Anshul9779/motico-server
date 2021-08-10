import {
  INCOMPLETE_DATA,
  INTERNAL_SERVER_ERROR,
  USER_NOT_FOUND,
} from "./../errors";
import { Request, Response } from "express";
import { Types } from "mongoose";

const ObjectId = Types.ObjectId;

// Basic CRUD Operations for Users

import UserModel from "./../models/User";
import { AuthenticatedRequest } from "./auth";
import Company from "./../models/Company";
import TeamModel from "./../models/Team";
import PhoneNumber from "./../models/PhoneNumber";

/**
 * Online Users Details
 *
 * [`GET`, `ADMIN`, `Protected`]
 *
 * Gets the details of all the online users.
 *
 *
 */
export const onlineUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = await UserModel.findOne({ _id: req.user.id }).exec();
    const users = await UserModel.find({
      isOnline: true,
      company: admin.company,
    }).exec();

    res.status(200).json(
      users.map((user) => {
        return {
          id: user._id,
          name: user.firstName + " " + (user.lastName ?? ""),
          // TODO: Add avatar url
          avatarURL: "",
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

/**
 * User update the company
 *
 * [`GET`, `ADMIN`, `Protected`]
 */
export const userAddCompany = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const payload: { companyId: string; userId: string } = req.body;
    const { companyId, userId } = payload;
    if (!companyId || !userId) {
      res.status(400).json(INCOMPLETE_DATA);
    }
    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      { company: ObjectId(companyId) }
    ).exec();
    if (!user) {
      res.status(404).json(USER_NOT_FOUND);
    } else {
      res.status(200).json({
        message: "User Updated",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

/**
 * User update the roles
 *
 * [`GET`, `ADMIN`, `Protected`]
 *
 * expects = > *roles => string[] => new roles (prev roles will be overwritten)
 */
export const userAddRoles = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const roles: string[] = req.body.roles;
    const userId: string = req.body.userId;
    if (!roles || !userId) {
      return res.status(400).json(INCOMPLETE_DATA);
    }
    const user = await UserModel.findByIdAndUpdate(
      { _id: userId },
      { roles }
    ).exec();
    if (!user) {
      res.status(404).json(USER_NOT_FOUND);
    } else {
      res.status(200).json({
        message: "User Updated",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const createCompnay = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.body.name || !req.body.email) {
      return res.status(400).json(INCOMPLETE_DATA);
    }
    const { name, email } = req.body;
    const company = await Company.create({
      name,
      email,
    });
    res.status(201).json({
      id: company._id,
      name: company.name,
      email: company.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const addUserToTeam = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const payload = req.body;
  if (!payload.userId || !payload.teamId) {
    res.sendStatus(400).json(INCOMPLETE_DATA);
  }

  await TeamModel.findByIdAndUpdate(payload.teamId, {
    $push: { users: payload.userId },
  }).exec();
  return res.sendStatus(200).send("OK");
};

export const getUsersByCompany = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const companyId = req.user.companyId;
  const users = await UserModel.find({ company: companyId }).exec();
  const data = users.map((u) => {
    return {
      id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumbers: u.phoneNumbers,
    };
  });
  return res.json(data);
};

export const getUserDetails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.body.userId;
  const user = await UserModel.findById(userId).exec();
  return res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumbers: user.phoneNumbers,
    roles: user.roles,
    company: user.comany,
    id: user._id,
  });
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.body.userId;
  if (!userId) {
    return res.json(INCOMPLETE_DATA);
  }
  // First remove from Teams
  const teams = await TeamModel.find({
    users: userId,
  }).exec();
  await Promise.all(
    teams.map(async (team) => {
      team.users = team.users.filter((id) => id !== userId);
      return await team.save();
    })
  );

  // Remove from PhoneNumbers
  const phoneNumbers = await PhoneNumber.find({
    assignedTo: userId,
  });

  await Promise.all(
    phoneNumbers.map(async (phoneNumber) => {
      phoneNumber.assignedTo = phoneNumber.assignedTo.filter(
        (id) => id !== userId
      );
      return await phoneNumber.save();
    })
  );

  // Now Delete the user

  await UserModel.findByIdAndDelete(userId).exec();

  return res.json({
    message: "OK",
  });
};
