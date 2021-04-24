import { Schema, Types, model, Model, Document } from "mongoose";
import { Company } from "./Company";
import bcrypt from "bcrypt";

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    roles: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export interface UserBase extends Document, Record<string, unknown> {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  company?: Types.ObjectId | Record<string, unknown>;
}

export interface UserDocument extends UserBase {
  company?: Company["_id"];
}

export interface UserPopulatedDocument extends UserBase {
  company?: Company;
}

export interface TokenUser {
  firstName: UserBase["firstName"];
  lastName?: UserBase["lastName"];
  email: UserBase["email"];
  issuedAt: number;
  id: UserBase["_id"];
  validTime?: number;
}

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

const UserModel = model<UserDocument, Model<UserDocument>>("User", UserSchema);

export default UserModel;
