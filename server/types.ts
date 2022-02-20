import { TokenUser } from "./models/User";
import { Request } from "express";
import { User } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user: TokenUser;
}

export type TypedRequest<
  ReqBody = Record<string, unknown>,
  QueryString = Record<string, unknown>
> = Request<
  Record<string, unknown>,
  Record<string, unknown>,
  ReqBody,
  QueryString
>;

export interface AuthenticatedTypedRequest<ReqBody, QueryString>
  extends TypedRequest<ReqBody, QueryString> {
  user: TokenUser;
}

export type SafeUser = Omit<User, "password"> & { validTime: number };
