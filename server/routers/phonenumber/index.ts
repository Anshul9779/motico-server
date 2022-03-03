import { Router } from "express";
import { authenticateToken, isAdmin } from "../../utils/auth";
import {
  addNumber,
  assignPhoneNumber,
  getNumberSettings,
  getCompanyPhoneNumbers,
  updateNumberSetting,
  getPhonenumber,
} from "./handler";

const router = Router();

router.get("/:id/settings", authenticateToken, getNumberSettings);
router.put("/:id/settings", authenticateToken, updateNumberSetting);
router.post("/:id/assign", authenticateToken, assignPhoneNumber);
router.get("/:id", authenticateToken, getPhonenumber);
router.get("/", isAdmin, getCompanyPhoneNumbers);
router.post("/", isAdmin, addNumber);

export default router;
