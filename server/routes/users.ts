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
