import { Router } from "express";
import twilio from "twilio";
import { authenticateToken, isAdmin } from "../../utils/auth";
import incomingRouter from "./utils/incoming";
import outgoingRouter from "./utils/outgoing";
import {
  buyNumber,
  getAvailablePhoneNumbers,
  twillioToken,
} from "./utils/util";

const router = Router();

// Expects a Query Param as callId

router.post("/phonenumber/search", authenticateToken, getAvailablePhoneNumbers);

router.post("/phonenumber/buy", isAdmin, buyNumber);

router.get("/token", authenticateToken, twillioToken);
router.use("/incoming", incomingRouter);
router.use("/outgoing", outgoingRouter);

export default router;
