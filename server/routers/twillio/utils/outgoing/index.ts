import { Router } from "express";
import twilio from "twilio";
import { confConnect, getCallRecordID, outgoingStart } from "./handlers";

const router = Router();

// /api/twillio/outgoing

/**
 * How to start a phone call?
 * First Get the token -> Token is valid for a 1hr only, Refresh the token in 30 -45 mins
 * If you want to dial a number -> Hit the /id outgoing endpoint -> Recive the CallRecord ID ->
 * Hit the /outgoing API with the from, to, and the CallRecord ID, when call is connected the startTime, endTime
 * and duration are calculated and updated on disconnecting the call.
 */

router.post("/", twilio.webhook({ validate: false }), outgoingStart);

router.post("/id", getCallRecordID);
router.post("/conf/:sid/add-participant/:callerId/:phone", confConnect);

export default router;
