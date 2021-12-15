import jwt from "jsonwebtoken";
import { TokenUser } from "../models/User";

const SECRET_TOKEN = "randomstring_KLNL kn lk091830 knl";

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
