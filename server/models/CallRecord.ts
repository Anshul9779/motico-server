import { Document, Model, model, Schema, Types } from "mongoose";
import { Company } from "./Company";
import { UserBase } from "./User";

const CallRecordSchema = new Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  callSid: {
    type: String,
    required: true,
    default: "",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
    required: true,
  },
  duration: {
    type: Number,
  },
  startTime: {
    type: Number,
  },
  endTime: {
    type: Number,
  },
  type: {
    type: String,
    required: true,
    enum: ["INCOMING", "OUTGOING", "MISSED"],
  },
});

export interface CallRecordBase extends Document {
  from: string;
  to: string;
  user: Types.ObjectId | Record<string, unknown>;
  /*
   * Time in milliseconds
   */
  duration: number;
  startTime: number;
  endTime: number;
  type: "INCOMING" | "OUTGOING" | "MISSED";
  isActive: boolean;
  callSid: string;
  company: Types.ObjectId | Record<string, unknown>;
}

export interface CallRecordDocument extends CallRecordBase {
  user: UserBase["_id"];
  company: Company["_id"];
}

export interface CallRecordPopulated extends CallRecordBase {
  user: UserBase;
  company: Company;
}

const CallRecorModel = model<CallRecordDocument, Model<CallRecordDocument>>(
  "CallRecord",
  CallRecordSchema
);

export default CallRecorModel;
