import { AuthenticatedRequest } from "./../../routes/auth";
import { Response } from "express";
import { INCOMPLETE_DATA } from "./../../errors";
import TeamModel from "./../../models/Team";

export const createTeam = async (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body;
  if (!payload.name) {
    return res.sendStatus(400).json(INCOMPLETE_DATA);
  }
  const name = payload.name;
  const cascading = payload.cascading;
  const userIds: string[] = payload.userIds;

  const newTeam = await TeamModel.create({
    name,
    cascading,
    company: req.user.companyId,
    users: userIds,
  });
  return res.sendStatus(201).json({
    id: newTeam._id,
    name: newTeam.name,
  });
};

export const deleteTeam = async (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body;
  if (!payload.teamId) {
    res.sendStatus(400).json(INCOMPLETE_DATA);
  }
  await TeamModel.findByIdAndDelete(payload.teamId).exec();
  res.sendStatus(200).send("Deleted");
};

export const getTeams = async (req: AuthenticatedRequest, res: Response) => {
  const company = req.user.companyId;
  const teams = await TeamModel.find({ company }).exec();
  return res.json(
    teams.map((team) => {
      return {
        id: team["_id"],
        name: team["name"],
        numUsers: team["users"].length,
      };
    })
  );
};
