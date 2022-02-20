import PhoneNumberModel from "../models/PhoneNumber";
import TeamModel from "../models/Team";
import UserModel from "../models/User";

export const removePhonenumberFromUser = async (
  phoneNumberId: string,
  userId: string
) => {
  const user = await UserModel.findById(userId).exec();
  if (!user) {
    return;
  }

  await UserModel.findByIdAndUpdate(userId, {
    phoneNumbers: user.phoneNumbers?.filter((phoneNumber) => {
      const bool = phoneNumber.toString() != phoneNumberId;

      return bool;
    }),
  }).exec();

  const phoneNumber = await PhoneNumberModel.findById(phoneNumberId).exec();
  await PhoneNumberModel.findByIdAndUpdate(phoneNumberId, {
    assignedTo: phoneNumber.assignedTo?.filter((id) => {
      const bool = id.toString() != userId;

      return bool;
    }),
  }).exec();
};

export const removePhoneNumberFromTeam = async (
  phonenumberId: string,
  teamId: string
) => {
  if (!teamId || !phonenumberId) return;
  await PhoneNumberModel.findByIdAndUpdate(phonenumberId, {
    team: null,
  }).exec();
  await TeamModel.findByIdAndUpdate(teamId, { number: null }).exec();
};

export const addPhonenumberToTeam = async (
  phoneNumberId: string,
  teamId: string
) => {
  await PhoneNumberModel.findByIdAndUpdate(phoneNumberId, {
    team: teamId,
  }).exec();
  await TeamModel.findByIdAndUpdate(teamId, { number: phoneNumberId }).exec();
};

export type AssignPhoneNumberFnPN = {
  type: "phonenumber";
  userId: string;
  phoneNumberIds: string[];
};
export type AssignPhoneNumberFnUser = {
  type: "user";
  userIds: string[];
  phoneNumberId: string;
};
export type AssignPhoneNumberFnTeam = {
  type: "team";
  teamId: string;
  phoneNumberId: string;
};
export const assignPhonenumberGeneric = async (
  options:
    | AssignPhoneNumberFnUser
    | AssignPhoneNumberFnTeam
    | AssignPhoneNumberFnPN
) => {
  if (options.type === "phonenumber") {
    const { phoneNumberIds, userId } = options;

    const user = await UserModel.findById(userId).exec();

    const prevIds = user.phoneNumbers ?? ([] as string[]);

    const removedIds = prevIds.filter((id) => !phoneNumberIds.includes(id));

    await Promise.all(
      removedIds.map(async (phonenumberId) =>
        removePhonenumberFromUser(phonenumberId, userId)
      )
    );

    await UserModel.findByIdAndUpdate(userId, {
      phoneNumbers: phoneNumberIds,
    }).exec();
    await Promise.all(
      phoneNumberIds.map(async (id) => {
        await PhoneNumberModel.findByIdAndUpdate(id, {
          $push: { assignedTo: userId },
        });
      })
    );
  } else if (options.type === "user") {
    const { phoneNumberId, userIds } = options;
    const phoneNumber = await PhoneNumberModel.findById(phoneNumberId).exec();
    const prevUserIds = phoneNumber.assignedTo as string[];

    // Find all the removedIds and remove them
    const removedIds = prevUserIds.filter((id) => !userIds.includes(id));
    await Promise.all(
      removedIds.map((id) => removePhonenumberFromUser(phoneNumberId, id))
    );
    await removePhoneNumberFromTeam(phoneNumberId, phoneNumber.team);
    // Now set the new ids
    await PhoneNumberModel.findByIdAndUpdate(phoneNumberId, {
      assignedTo: userIds,
    }).exec();
    await Promise.all(
      userIds.map(async (userId) => {
        await UserModel.findByIdAndUpdate(userId, {
          $push: {
            phoneNumbers: phoneNumberId,
          },
        }).exec();
      })
    );
  } else {
    const phoneNumber = await PhoneNumberModel.findById(
      options.phoneNumberId
    ).exec();
    const { phoneNumberId, teamId } = options;
    // Its the team thingy, easy peasy
    // Remove the userIds

    if (phoneNumber.assignedTo.length > 0) {
      await Promise.all(
        phoneNumber.assignedTo.map((userId) =>
          removePhonenumberFromUser(phoneNumberId, userId)
        )
      );
    }
    // If its assigned to another team, remove it
    if (phoneNumber.team != teamId)
      await removePhoneNumberFromTeam(phoneNumberId, phoneNumber.team);
    //Do nothing is already same teaml
    if (phoneNumber.team == teamId) return;

    await addPhonenumberToTeam(phoneNumberId, teamId);
  }
};
