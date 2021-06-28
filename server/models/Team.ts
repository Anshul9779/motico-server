import { Model, model, Schema, Types, Document } from "mongoose";
import { Company } from "./Company";
import { UserBase } from "./User";

const TeamSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  cascading: {
    type: String,
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
});

export interface TeamBase extends Document {
  name: string;
  cascading: string;
  company: Types.ObjectId | Record<string, unknown>;
  users: Types.ObjectId[] | Record<string, unknown>[];
}

export interface TeamDocument extends TeamBase {
  users: UserBase["_id"][];
  company: Company["_id"];
}

export interface TeamPopulated extends TeamBase {
  users: UserBase[];
  company: Company;
}

const TeamModel = model<TeamDocument, Model<TeamDocument>>("Team", TeamSchema);

export default TeamModel;
