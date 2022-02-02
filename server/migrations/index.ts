import logger from "../logger";
import PhoneNumberSetting from "./PhoneNumberSetting";

const migrations = () => {
  logger.log("info", {
    timestamp: new Date().toISOString(),
    function: "migrations",
    message: "Running Migrations",
  });
  return PhoneNumberSetting();
};

export default migrations;
