import express from "express";
import { createTeam, deleteTeam, getTeams } from "./handler";
import { isAdmin } from "./../../routes/auth";

// Handles all /api/teams routes

const router = express.Router();

router.post("/new", isAdmin, createTeam);
router.post("/delete", isAdmin, deleteTeam);
router.post("/", isAdmin, getTeams);

export default router;
