import { Document, Model, model, Schema, Types } from "mongoose";
import { Company } from "./Company";
import { UserBase } from "./User";

const phoneNumberSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  purchasedOn: {
    type: Number,
  },
  twillioId: {
    type: String,
    required: true,
  },
  assignedTo: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
  number: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  isRecording: {
    type: Boolean,
    required: true,
  },
  voiceMail: {
    type: Boolean,
    required: true,
  },
  available: {
    type: Boolean,
    required: true,
  },
});

export interface PhoneNumberBase extends Document {
  name: string;
  cost: number;
  company: Types.ObjectId | Record<string, unknown>;
  purchasedOn: number;
  twillioId: string;
  assignedTo: Types.ObjectId[] | Record<string, unknown>[];
  number: string;
  country: string;
  area: string;
  isRecording: boolean;
  voiceMail: boolean;
  available: boolean;
}

export interface PhoneNumberDocument extends PhoneNumberBase {
  company: Company["_id"];
  assignedTo: UserBase["_id"][];
}

export interface PhoneNumberPopulated extends PhoneNumberBase {
  company: Company;
  assignedTo: UserBase[];
}

const PhoneNumberModel = model<PhoneNumberDocument, Model<PhoneNumberDocument>>(
  "PhoneNumber",
  phoneNumberSchema
);

export default PhoneNumberModel;
