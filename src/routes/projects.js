// routes/projects.js
import express from "express";
import {
  auth,
  getProjects,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
  getActiveProjects,
} from "../controllers/projects.js";

const router = express.Router();

router.get("/", auth, getProjects);
router.get("/active", auth, getActiveProjects);
router.get("/:id", auth, getProjectById);
router.post("/", auth, addProject);
router.patch("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);

export default router;
