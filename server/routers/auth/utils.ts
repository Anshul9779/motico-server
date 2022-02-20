import bcrypt from "bcrypt";
import { SafeUser } from "../../types";
import jwt from "jsonwebtoken";

const SECRET_TOKEN =
  process.env.SECRET_TOKEN || "randomstring_KLNL kn lk091830 knl";

const SALT_ROUNDS = 10;

export const generateHashedPassword = (oldPassword: string) => {
  return bcrypt.hash(oldPassword, SALT_ROUNDS);
};

export const comparePassword = (
  plainPassword: string,
  encryptedPassword: string
) => {
  return bcrypt.compare(plainPassword, encryptedPassword);
};

const TOKEN_VALIDATITY = 24 * 60 * 60;

export const generateAccessToken = (userDetails: SafeUser) => {
  userDetails["validTime"] = TOKEN_VALIDATITY * 1000;
  return jwt.sign(userDetails, SECRET_TOKEN, {
    expiresIn: `${TOKEN_VALIDATITY}s`, // Expires in 24hr
  });
};
