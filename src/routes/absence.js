import express from "express";
import { auth } from "../middleware/auth.js";
import { getAbsence, GetAbsenceById } from "../controllers/absence.js";

const router = express.Router();

router.get("/", auth, getAbsence);
router.get("/:id", auth, GetAbsenceById);
export default router;
