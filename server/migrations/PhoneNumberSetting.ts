// this migration will create new number settings for all the numbers not there.

import NumberSetting from "../models/NumberSettings";
import PhoneNumber from "../models/PhoneNumber";

const migration = async () => {
  const phoneNumbers = await PhoneNumber.find().exec();
  await Promise.all(
    phoneNumbers.map(async (phoneNumber) => {
      const numberSetting = await NumberSetting.find({
        phoneNumber: phoneNumber._id,
      }).exec();
      if (numberSetting.length === 0) {
        // Create one
        await NumberSetting.create({
          phoneNumber: phoneNumber._id,
          canRecord: false,
          canPause: false,
          documentStatus: "VERIFIED",
          greetingMessageStatus: "DISABLED",
          voiceMailStatus: "DISABLED",
          ivrStatus: "DISABLED",
          callQueing: true,
        });
        console.log(`Created Number Settings for ${phoneNumber.number}`);
      }
    })
  );
  console.log("Completed Migration for PhoneNumber Settings");
};

export default migration;
