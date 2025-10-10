import express from "express";
import { auth } from "../middleware/auth.js";
import { login, register, logout, me, refresh } from "../controllers/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/me", auth, me);
router.post("/refresh", refresh);
export default router;
