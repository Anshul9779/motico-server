import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { ROLES } from "../constants";
import { FORBIDDEN, TOKEN_ERROR, UNAUTHORIZED } from "../errors";
import { TokenUser } from "../models/User";
import { AuthenticatedTypedRequest } from "../types";

const SECRET_TOKEN =
  process.env.SECRET_TOKEN || "randomstring_KLNL kn lk091830 knl";

const SALT_ROUNDS = 10;

export const verifyJWTToken = (token: string): Promise<TokenUser> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SECRET_TOKEN, (err, user: TokenUser) => {
      if (err) {
        reject(err);
      }
      resolve(user);
    });
  });
};

export const authenticateToken = (
  req: AuthenticatedTypedRequest<any, any>,
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
  req: AuthenticatedTypedRequest<any, any>,
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
