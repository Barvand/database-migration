import express from "express";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadImage } from "../controllers/upload.js";

const router = express.Router();

router.post(
  "/projects/:projectCode/images",
  auth,
  upload.single("image"),
  uploadImage,
);

export default router;
