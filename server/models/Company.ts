import { Document, Model, model, Schema } from "mongoose";

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export interface Company extends Document, Record<string, unknown> {
  name: string;
  details?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyModel = model<Company, Model<Company>>("Company", CompanySchema);

export default CompanyModel;
