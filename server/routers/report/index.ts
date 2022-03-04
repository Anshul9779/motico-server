import express from "express";
import { authenticateToken } from "../../utils/auth";
import { dailyReports, userReports } from "./handler";

// Handles all /api/teams routes

const router = express.Router();

router.get("/users", authenticateToken, userReports);
router.get("/daily", authenticateToken, dailyReports);

export default router;
