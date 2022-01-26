import { Router } from "express";
import { handleIncomingCall, handleVoiceMailAction } from "./handlers";

const router = Router();

// /api/twillio/incoming

router.post("/voicemail/:id", handleVoiceMailAction);
router.post("/", handleIncomingCall);

export default router;
