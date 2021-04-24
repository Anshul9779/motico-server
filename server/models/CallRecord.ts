import { Document, Model, model, Schema, Types } from "mongoose";
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
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
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
}

export interface CallRecordDocument extends CallRecordBase {
  user: UserBase["_id"];
}

export interface CallRecordPopulated extends CallRecordBase {
  user: UserBase;
}

const CallRecorModel = model<CallRecordDocument, Model<CallRecordDocument>>(
  "CallRecord",
  CallRecordSchema
);

export default CallRecorModel;
