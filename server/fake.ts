// Create a admin user

import User from "./models/User";
import Company from "./models/Company";
import { Types } from "mongoose";

export const main = async () => {
  const company = await Company.findOne({
    _id: Types.ObjectId("6078157dc498e72bf0d3a7d6"),
  }).exec();
  console.log("Company Created", company);
  const adminUser = await User.create({
    firstName: "Admin",
    lastName: "Admin",
    email: "admin2@motico.com",
    password: "admin@123",
    roles: ["ROLE_ADMIN"],
    company: company._id,
  });
  console.log("Admin User", adminUser);
};

main();
