import express from "express";
import { auth } from "../middleware/auth.js";
import {
  hoursByUserProject,
  hoursByUser,
  hoursByProject,
  projectHoursDetail,
  projectHoursByUser,
  absenceHoursDetail,
  absenceHoursByUser,
} from "../controllers/reports.js";

const router = express.Router();

// Existing summary endpoints
router.get("/hours/by-user-project", auth, hoursByUserProject);
router.get("/hours/by-user", auth, hoursByUser);
router.get("/hours/by-project", auth, hoursByProject);

// NEW: Project-focused detail + summary endpoints
// Accept ?from=YYYY-MM-DD&to=YYYY-MM-DD (optional), and optional ?userId=
router.get("/projects/:projectId/hours", auth, projectHoursDetail);
router.get("/projects/:projectId/hours/by-user", auth, projectHoursByUser);
router.get("/absence/:absenceId/hours", auth, absenceHoursDetail);
router.get("/absence/:absenceId/hours-by-user", auth, absenceHoursByUser);

export default router;
