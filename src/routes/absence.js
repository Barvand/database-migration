import express from "express";
import { auth } from "../middleware/auth.js";
import { getAbsence } from "../controllers/absence.js";

const router = express.Router();

router.get("/", auth, getAbsence);

export default router;
