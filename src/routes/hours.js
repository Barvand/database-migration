import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getHours,
  getHourById,
  addHour,
  updateHour,
  deleteHour,
  getHoursByUser,
  getHoursByProject,
} from "../controllers/hours.js";

const router = express.Router();

// Convenience FIRST (so "/users/..." won't be eaten by "/:id")
router.get("/users/:userId/hours", auth, getHoursByUser);
router.get("/projects/:projectId/hours-list", auth, getHoursByProject);

// CRUD
router.get("/", auth, getHours);
router.get("/:id", auth, getHourById);
router.post("/", auth, addHour);
router.put("/:id", auth, updateHour);
router.delete("/:id", auth, deleteHour);

export default router;
