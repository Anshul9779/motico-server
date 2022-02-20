import { TokenUser } from "./models/User";
import { Request } from "express";
import { User } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user: TokenUser;
}

export type TypedRequest<
  ReqBody = Record<string, unknown>,
  QueryString = Record<string, unknown>,
  Params extends Record<string, string> = {}
> = Request<Params, Record<string, unknown>, ReqBody, QueryString>;

export interface AuthenticatedTypedRequest<
  ReqBody = {},
  QueryString = {},
  Params extends Record<string, string> = {}
> extends TypedRequest<ReqBody, QueryString, Params> {
  user: SafeUser;
}

export type SafeUser = Omit<User, "password"> & { validTime: number };
