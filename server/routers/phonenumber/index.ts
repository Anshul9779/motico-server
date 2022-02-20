import { Router } from "express";
import { authenticateToken, isAdmin } from "../../utils/auth";
import {
  addNumber,
  assignPhoneNumber,
  getNumberSettings,
  getRegisteredPhoneNumbers,
  updateNumberSetting,
} from "./handler";

const router = Router();

router.get("/registered", isAdmin, getRegisteredPhoneNumbers);
router.post("/new", isAdmin, addNumber);
router.post("/assign", isAdmin, assignPhoneNumber);
router.post("/settings", authenticateToken, getNumberSettings);
router.put("/settings", authenticateToken, updateNumberSetting);

export default router;
