import {
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
} from "./../models/User";
import jwt from "jsonwebtoken";
import { ROLES } from "./../constants";

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
