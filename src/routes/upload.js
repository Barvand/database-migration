import express from "express";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadImage, deleteImage } from "../controllers/upload.js";

const router = express.Router();

router.post(
  "/projects/:projectCode/images",
  auth,                    
  upload.array("images", 10),
  uploadImage
);
export default router;

router.delete(
  "/projects/images/:imageId",
  auth,
  deleteImage
);