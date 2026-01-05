import express from "express";
import authRoutes from "./src/routes/auth.js";
import projectRoutes from "./src/routes/projects.js";
import hoursRoutes from "./src/routes/hours.js";
import reportsRoutes from "./src/routes/reports.js";
import absenceRoutes from "./src/routes/absence.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import usersRoutes from "./src/routes/users.js";

const app = express();
app.set("trust proxy", 1);
const IS_PROD = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: IS_PROD
      ? "https://totaltiming.app" // ✅ Match your frontend domain
      : "http://localhost:5173", // ✅ Your local dev
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.get("/api/health", async (_req, res) => res.json({ ok: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api/projects", projectRoutes);
app.use("/api/auth/", authRoutes);
app.use("/api/hours", hoursRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/absence", absenceRoutes);
app.use("/api/users", usersRoutes);

app.listen(8800, () => console.log("API on :8800"));
