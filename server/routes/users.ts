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
import TeamModel from "./../models/Team";
import PhoneNumber from "./../models/PhoneNumber";
import { AuthenticatedTypedRequest } from "../types";
import prisma from "../prisma";
import { Company, User, UserSettings } from "@prisma/client";

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
  req: AuthenticatedTypedRequest<{ name: string; email: string }>,
  res: Response
) => {
  try {
    const { name, email } = req.body;
    const company = await prisma.company.create({
      data: {
        name,
        details: email,
      },
    });
    res.status(201).json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const addUserToTeam = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const payload = req.body;
    if (!payload.userId || !payload.teamId) {
      res.sendStatus(400).json(INCOMPLETE_DATA);
    }

    await TeamModel.findByIdAndUpdate(payload.teamId, {
      $push: { users: payload.userId },
    }).exec();
    return res.sendStatus(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.json(INTERNAL_SERVER_ERROR);
  }
};

export const getUsersByCompany = async (
  req: AuthenticatedTypedRequest,
  res: Response
) => {
  try {
    const { companyId } = req.user;
    const companyUser = await prisma.user.findMany({
      where: {
        companyId,
      },
      include: {
        phoneNumbers: true,
        team: true,
      },
    });
    const data = companyUser.map((u) => {
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phoneNumbers: u.phoneNumbers,
        team: u.team,
      };
    });
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const getUserDetails = async (
  req: AuthenticatedTypedRequest<{}, {}, { id: string }>,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        phoneNumbers: true,
        settings: true,
        team: true,
      },
    });

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const assignNumberToUser = async (
  req: AuthenticatedTypedRequest<{ ids: number[] }, {}, { id: string }>,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { ids } = req.body;

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        phoneNumbers: {
          set: ids.map((id) => ({ id })),
        },
      },
    });

    return res.send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

export const deleteUser = async (
  req: AuthenticatedTypedRequest<{ id: number }>,
  res: Response
) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json(INCOMPLETE_DATA);
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });
    return res.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return res.json(INTERNAL_SERVER_ERROR);
  }
};

export const getMe = async (req: AuthenticatedTypedRequest, res: Response) => {
  const { id } = req.user;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      settings: true,
      company: true,
    },
  });

  const { password, ...safeUser } = user;

  return res.json(safeUser);
};

export const setMe = async (
  req: AuthenticatedTypedRequest<
    Partial<User & { settings: UserSettings; company: Company }>
  >,
  res: Response
) => {
  const { id } = req.user;

  const { settings, company, ...user } = req.body;

  const newUser = await prisma.user.update({
    where: {
      id,
    },
    data: user,
    include: {
      settings: true,
      company: true,
    },
  });
  const newSettings = await prisma.userSettings.update({
    where: {
      id: settings.id,
    },
    data: settings,
  });

  const { password, ...safeUser } = newUser;

  return res.json({ ...safeUser, settings });
};
