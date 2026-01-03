import express from "express";
import { auth } from "../middleware/auth.js";
import { getUsers } from "../controllers/users.js";

const router = express.Router();

router.get("/", auth, getUsers);

export default router;
