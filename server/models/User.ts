import { Schema, Types, model, Model, Document } from "mongoose";
import { Company } from "./Company";
import bcrypt from "bcrypt";
import { PhoneNumberBase } from "./PhoneNumber";

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    phoneNumber: {
      type: String,
      required: false,
      default: "",
    },
    reciveUpdates: {
      type: Boolean,
      required: false,
      default: false,
    },
    missedCallAlert: {
      type: Boolean,
      required: false,
      default: false,
    },
    voicemailAlert: {
      type: Boolean,
      required: false,
      default: false,
    },
    dashboard: {
      type: Boolean,
      required: false,
      default: false,
    },
    dialler: {
      type: Boolean,
      required: false,
      default: false,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    phoneNumbers: [
      {
        type: Schema.Types.ObjectId,
        ref: "PhoneNumber",
      },
    ],
    password: {
      type: String,
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    isOnline: {
      type: Boolean,
      default: false,
      required: true,
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
  phoneNumbers?: Types.ObjectId[] | Record<string, unknown>[] | any[];
  isOnline: boolean;
  phoneNumber: string;
  reciveUpdates: boolean;
  missedCallAlert: boolean;
  voicemailAlert: boolean;
  dashboard: boolean;
  dialler: boolean;
}

export interface UserDocument extends UserBase {
  company?: Company["_id"];
  phoneNumbers?: PhoneNumberBase["_id"][];
}

export interface UserPopulatedDocument extends UserBase {
  company?: Company;
  phoneNumbers?: PhoneNumberBase[];
}

export interface TokenUser {
  firstName: UserBase["firstName"];
  lastName?: UserBase["lastName"];
  email: UserBase["email"];
  issuedAt: number;
  id: UserBase["_id"];
  roles: UserBase["roles"];
  companyId: string;
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
