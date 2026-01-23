// routes/projects.js
import express from "express";
import { auth } from "../middleware/auth.js";
import {
  GetProjects,
  GetProjectById,
  addProject,
  updateProject,
  deleteProject,
  getActiveProjects,
  getProjectImages,
} from "../controllers/projects.js";

const router = express.Router();

router.get("/:projectCode/images", auth, getProjectImages);
router.get("/", auth, GetProjects);
router.get("/active", auth, getActiveProjects);
router.get("/:id", auth, GetProjectById);
router.post("/", auth, addProject);
router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);
export default router;
