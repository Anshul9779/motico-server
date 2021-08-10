import PhoneNumberSetting from "./PhoneNumberSetting";

const migrations = () => {
  console.log("Runnning Migrations");
  return PhoneNumberSetting();
};

export default migrations;
