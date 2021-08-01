import { Schema } from "mongoose";

const numberSettingsSchema = new Schema({
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
});
