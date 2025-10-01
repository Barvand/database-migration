import "dotenv/config";
import express from "express";
import authRoutes from "./src/routes/auth.js";
import projectRoutes from "./src/routes/projects.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "https://manhours.netlify.app/login",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.get("/api/health", async (_req, res) => res.json({ ok: true }));

app.use(express.json());
app.use(cookieParser());
app.use("/api/projects", projectRoutes);
app.use("/api/auth/", authRoutes);
app.listen(8800, () => console.log("API on :8800"));
