import express from "express";
import { isAdmin } from "../../utils/auth";
import { createTeam, deleteTeam, getTeam, getTeams } from "./handler";

// Handles all /api/teams routes

const router = express.Router();

router.post("/", isAdmin, createTeam);
router.post("/delete", isAdmin, deleteTeam);
router.get("/:id", isAdmin, getTeam);
router.get("/", isAdmin, getTeams);

export default router;
