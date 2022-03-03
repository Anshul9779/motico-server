import express from "express";
import { isAdmin } from "../../utils/auth";
import {
  createTeam,
  deleteTeam,
  getTeam,
  getTeams,
  updateTeam,
} from "./handler";

// Handles all /api/teams routes

const router = express.Router();

router.post("/", isAdmin, createTeam);
router.post("/delete", isAdmin, deleteTeam);
router.get("/:id", isAdmin, getTeam);
router.post("/:id", isAdmin, updateTeam);
router.get("/", isAdmin, getTeams);

export default router;
