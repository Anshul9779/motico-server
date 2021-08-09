import { Schema, Document, Types, model, Model } from "mongoose";
import { PhoneNumberBase } from "./PhoneNumber";

const numberSettingSchema = new Schema({
  phoneNumber: {
    type: Schema.Types.ObjectId,
    ref: "PhoneNumber",
    required: true,
  },
  canRecord: {
    type: Boolean,
    required: true,
  },
  canPause: {
    type: Boolean,
    required: true,
  },
  documentStatus: {
    type: String,
    enum: ["UPLOADED", "VERIFIED", "PENDING", "NOT_UPLOADED"],
    default: "VERIFIED",
  },
  greetingMessageStatus: {
    type: String,
    enum: ["DISABLED", "TEXT", "AUDIO"],
    default: "DISABLED",
  },
  greetingMessageInfo: {
    type: String,
    required: false,
    default: "",
  },
  voiceMailStatus: {
    type: String,
    enum: ["DISABLED", "TEXT", "AUDIO"],
    default: "DISABLED",
  },
  voiceMailInfo: {
    type: String,
    required: false,
    default: "",
  },
  ivrStatus: {
    type: String,
    enum: ["DISABLED", "TEXT", "AUDIO"],
    default: "DISABLED",
  },
  ivrInfo: {
    type: String,
    required: false,
    default: "",
  },
  callQueing: {
    type: Boolean,
    required: true,
  },
});

type Status = "DISABLED" | "TEXT" | "AUDIO";
export interface NumberSettingBase extends Document, Record<string, unknown> {
  phoneNumber: Types.ObjectId | Record<string, unknown>;
  carRecord: boolean;
  canPause: boolean;
  documentStatus: "UPLOADED" | "VERIFIED" | "PENDING" | "NOT_UPLOADED";
  greetingMessageStatus: Status;
  greetingMessageInfo: string;
  voiceMailStatus: Status;
  voiceMailInfo: string;
  ivrStatus: Status;
  ivrInfo: string;
  callQueing: boolean;
}

export interface NumberSettingDocument extends NumberSettingBase {
  phoneNumber: PhoneNumberBase["_id"];
}

export interface NumberSettingPopulated extends NumberSettingBase {
  phoneNumber: PhoneNumberBase;
}

const NumberSetting = model<
  NumberSettingDocument,
  Model<NumberSettingDocument>
>("NumberSetting", numberSettingSchema);
export default NumberSetting;
