import { Router } from "express";
import { authenticateToken, isAdmin } from "../../utils/auth";
import {
  addNumber,
  assignPhoneNumber,
  getNumberSettings,
  getCompanyPhoneNumbers,
  updateNumberSetting,
} from "./handler";

const router = Router();

router.get("/:id/settings", authenticateToken, getNumberSettings);
router.put("/:id/settings", authenticateToken, updateNumberSetting);
router.post("/:id/assign", isAdmin, assignPhoneNumber);
router.get("/", isAdmin, getCompanyPhoneNumbers);
router.post("/", isAdmin, addNumber);

export default router;
