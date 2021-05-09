// Create a admin user

import User, { generateHashedPassword } from "./models/User";
import Company from "./models/Company";
import { Types } from "mongoose";

export const main = async () => {
  const company = await Company.findOne({
    _id: "6078157dc498e73bf0d3a7d6",
  }).exec();
  console.log("Company Created", company);
  const adminUser = await User.create({
    firstName: "Admin",
    lastName: "Admin",
    email: "admin@motico.com",
    password: await generateHashedPassword("admin123"),
    roles: ["ROLE_ADMIN"],
    company: company._id,
  });
  console.log("Admin User", adminUser);
};
