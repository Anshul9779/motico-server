import {
  DATA_INCORRECT,
  DUPLICATE_EMAIL,
  FORBIDDEN,
  INCOMPLETE_DATA,
  INTERNAL_SERVER_ERROR,
  TOKEN_ERROR,
  UNAUTHORIZED,
  USER_NOT_FOUND,
} from "./../errors";
import { Request, Response, NextFunction } from "express";
import UserModel, {
  comparePassword,
  generateHashedPassword,
  TokenUser,
  UserDocument,
} from "./../models/User";
import jwt from "jsonwebtoken";
import { NEW_USER_PASSWORD, ROLES } from "./../constants";
import PhoneNumber from "../models/PhoneNumber";
import TeamModel from "../models/Team";
import { AuthenticatedTypedRequest } from "../types";
import { Prisma } from "@prisma/client";
import prisma from "../prisma";

const SECRET_TOKEN = "randomstring_KLNL kn lk091830 knl";

export interface AuthenticatedRequest extends Request {
  user: TokenUser;
}

const sendMailInvite = async (newUser: UserDocument) => {
  throw new Error("Invite not implemented");
};

export const userInvite = async (
  req: AuthenticatedTypedRequest<
    Omit<Prisma.UserCreateInput, "phoneNumbers" | "team"> & {
      phoneNumbers: number[];
      team: number;
    }
  >,
  res: Response
) => {
  const { firstName, email, lastName, phoneNumbers, team } = req.body;
  const { companyId } = req.user;
  // Handle the error here
  if (!firstName || !email) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const password = await generateHashedPassword(NEW_USER_PASSWORD);
    const sameEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (sameEmail) {
      throw new Error("duplicate-email");
    }

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password,
        roles: [ROLES.NEW_USER, ROLES.PASSWORD_RESET, ROLES.USER],
        company: {
          connect: {
            id: companyId,
          },
        },
        phoneNumbers: {
          connect: phoneNumbers?.map((id) => ({ id })),
        },
        settings: {
          create: {
            showDialler: false,
          },
        },
        team: {
          connect: {
            id: team,
          },
        },
      },
    });

    const { password: _, ...safeUser } = user;

    // TODO: Implement this function
    // await sendMailInvite(createdUser);
    return res.status(201).json(safeUser);
  } catch (error) {
    console.error(error);
    if (error.message.includes("duplicate-email")) {
      return res.status(400).json(DUPLICATE_EMAIL);
    } else {
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    }
  }
};

// export const userPasswordReset = async (req: Request, res: Response) => {
//   const userId = req.body.userId;
//   const previousPassword = req.body.oldPassword;
//   const newPassword = req.body.newPassword;
//   if (!userId || !previousPassword || !newPassword) {
//     return res.json(INCOMPLETE_DATA);
//   }
//   const user = await UserModel.findById(userId).exec();
//   if (!user) {
//     return res.json(USER_NOT_FOUND);
//   }
//   // First verify the old password. Then reset the password.
//   const passwordMatched = await comparePassword(
//     previousPassword,
//     user.password
//   );
//   if (!passwordMatched) {
//     return res.json(DATA_INCORRECT);
//   }
//   // If password matched. Then renew the password and remove if reset_password is present;

//   user.password = await generateHashedPassword(newPassword);
//   user.roles = user.roles.filter((role) => role !== ROLES.PASSWORD_RESET);
//   await user.save();
//   const userDetails = {
//     email: user.email,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     roles: user.roles,
//     companyId: user.company,
//     issuedAt: new Date().getTime(),
//     id: user._id,
//   };
//   const token = generateAccessToken(userDetails);
//   return res.status(200).json({
//     token,
//     ...userDetails,
//   });
// };
