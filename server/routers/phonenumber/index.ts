import { Router } from "express";
import { isAdmin } from "./../../routes/auth";
import {
  addNumber,
  assignPhoneNumber,
  getRegisteredPhoneNumbers,
} from "./handler";

const router = Router();

router.get("/registered", isAdmin, getRegisteredPhoneNumbers);
router.post("/new", isAdmin, addNumber);
router.post("/assign", isAdmin, assignPhoneNumber);

export default router;
