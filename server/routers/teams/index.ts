import express from "express";
import { isAdmin } from "../../utils/auth";
import { createTeam, deleteTeam, getTeams } from "./handler";

// Handles all /api/teams routes

const router = express.Router();

router.post("/new", isAdmin, createTeam);
router.post("/delete", isAdmin, deleteTeam);
router.post("/", isAdmin, getTeams);

export default router;
