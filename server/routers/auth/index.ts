import express from "express";
import { login, signup } from "./handler";

// Handles all /api/teams routes

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);

export default router;
