import { Router } from "express";
import { authenticateToken } from "./../../routes/auth";
import {
  callDuration,
  callRecordTime,
  getCallRecordCSID,
  totalCalls,
} from "./handler";

const router = Router();

// /api/call

router.use(authenticateToken);

router.get("/call-duration", callDuration);
router.get("/analytics", totalCalls);
router.post("/time", callRecordTime);
router.post("/getcsid", getCallRecordCSID);

export default router;
