import { Router } from "express";
import { authenticateToken } from "./../../routes/auth";
import {
  callDuration,
  callRecordTime,
  getCallRecordCSID,
  getCallRecordFromId,
  getCallRecordings,
  getCallVoicemails,
  totalCalls,
} from "./handler";

const router = Router();

// /api/call

router.use(authenticateToken);

router.post("/id", authenticateToken, getCallRecordFromId);
router.get("/call-duration", callDuration);
router.get("/call-voicemail", authenticateToken, getCallVoicemails);
router.get("/call-recording", authenticateToken, getCallRecordings);
router.get("/analytics", totalCalls);
router.post("/time", callRecordTime);
router.post("/getcsid", getCallRecordCSID);

export default router;
