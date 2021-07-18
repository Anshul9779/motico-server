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

const SECRET_TOKEN = "randomstring_KLNL kn lk091830 knl";

export interface AuthenticatedRequest extends Request {
  user: TokenUser;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(401).json(UNAUTHORIZED);
  jwt.verify(token, SECRET_TOKEN, (err, user: TokenUser) => {
    if (err) {
      console.error(err);
      res.status(401).json(TOKEN_ERROR);
    }
    req.user = user;
    next();
  });
};

export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(401).json(UNAUTHORIZED);
  jwt.verify(token, SECRET_TOKEN, (err, user: TokenUser) => {
    if (err) {
      console.error(err);
      res.status(401).json(TOKEN_ERROR);
    } else if (user.roles.includes(ROLES.ADMIN)) {
      req.user = user;
      next();
    } else {
      res.status(403).json(FORBIDDEN);
    }
  });
};

const TOKEN_VALIDATITY = 24 * 60 * 60;

export const generateAccessToken = (userDetails: TokenUser) => {
  userDetails["validTime"] = TOKEN_VALIDATITY * 1000;
  return jwt.sign(userDetails, SECRET_TOKEN, {
    expiresIn: `${TOKEN_VALIDATITY}s`, // Expires in 24hr
  });
};

/**
 * Sign UP API
 *
 * [`POST`]
 *
 * Expects => *firstName, *email, *password, lastName
 *
 */
export const signupAPI = async (req: Request, res: Response) => {
  const payload = req.body;
  // Handle the error here
  if (!payload.firstName || !payload.email || !payload.password) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const hashedPassword = await generateHashedPassword(payload.password);

    const createdUser = await UserModel.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      roles: ["ROLE_USER"],
      isOnline: false,
    });
    // 201 Created
    createdUser.password = undefined;
    return res.status(201).json(createdUser);
  } catch (error) {
    console.error(error);
    if (
      error.code === 11000 ||
      error.message.includes("duplicate key error collection")
    ) {
      return res.status(400).json(DUPLICATE_EMAIL);
    } else {
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    }
  }
};

/**
 * Login API
 *
 * [`POST`]
 *
 * Expects => *email, *password
 *
 */
export const loginAPI = async (req: Request, res: Response) => {
  const payload = req.body;
  console.log("called");
  if (!payload.email || !payload.password) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const user = await UserModel.findOne({ email: payload.email }).exec();
    if (user === null) {
      return res.status(404).json(USER_NOT_FOUND);
    }
    if (!(await comparePassword(payload.password, user.password))) {
      return res.status(400).json({
        err: "INCORRECT_PASSWORD",
        message: "Your password or email are incorrect.",
      });
    }
    const userDetails = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      companyId: user.company,
      issuedAt: new Date().getTime(),
      id: user._id,
    };
    const token = generateAccessToken(userDetails);
    return res.status(200).json({
      token,
      ...userDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};

const sendMailInvite = async (newUser: UserDocument) => {
  throw new Error("Invite not implemented");
};

export const userInvite = async (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body;
  console.log(payload);
  payload.password = NEW_USER_PASSWORD;
  // Handle the error here
  if (!payload.firstName || !payload.email || !payload.phoneNumberId) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const hashedPassword = await generateHashedPassword(payload.password);

    const createdUser = await UserModel.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      roles: [ROLES.NEW_USER, ROLES.PASSWORD_RESET],
      phoneNumbers: payload.phoneNumberId,
      company: req.user.companyId,
      isOnline: false,
    });
    // Assign phone number to that user
    await PhoneNumber.findByIdAndUpdate(payload.phoneNumberId, {
      $push: { assignedTo: createdUser._id },
    }).exec();
    await TeamModel.findByIdAndUpdate(payload.teamId, {
      $push: { users: createdUser._id },
    }).exec();
    // TODO: Implement this function
    // await sendMailInvite(createdUser);
    res.sendStatus(200).send("OK");
  } catch (error) {
    console.error(error);
    if (
      error.code === 11000 ||
      error.message.includes("duplicate key error collection")
    ) {
      return res.status(400).json(DUPLICATE_EMAIL);
    } else {
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    }
  }
};

export const userPasswordReset = async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const previousPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  if (!userId || !previousPassword || !newPassword) {
    return res.json(INCOMPLETE_DATA);
  }
  const user = await UserModel.findById(userId).exec();
  if (!user) {
    return res.json(USER_NOT_FOUND);
  }
  // First verify the old password. Then reset the password.
  const passwordMatched = await comparePassword(
    previousPassword,
    user.password
  );
  if (!passwordMatched) {
    return res.json(DATA_INCORRECT);
  }
  // If password matched. Then renew the password and remove if reset_password is present;

  user.password = await generateHashedPassword(newPassword);
  user.roles = user.roles.filter((role) => role !== ROLES.PASSWORD_RESET);
  await user.save();
  const userDetails = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    companyId: user.company,
    issuedAt: new Date().getTime(),
    id: user._id,
  };
  const token = generateAccessToken(userDetails);
  return res.status(200).json({
    token,
    ...userDetails,
  });
};
