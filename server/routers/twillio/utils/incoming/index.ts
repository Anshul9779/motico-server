import { Router } from "express";
import { handleIncomingCall } from "./handlers";

const router = Router();

// /api/twillio/incoming

router.post("/", handleIncomingCall);

export default router;
