// Create a admin user

import User from "./models/User";
import Company from "./models/Company";

export const main = async () => {
  const company = await Company.create({
    name: "MotiCo",
    email: "admin@motico.com",
  });
  console.log("Company Created", company);
  const adminUser = await User.create({
    firstName: "Admin",
    lastName: "Admin",
    email: "admin@motico.com",
    password: "admin@123",
    roles: ["ROLE_ADMIN"],
    company: company._id,
  });
  console.log("Admin User", adminUser);
};
