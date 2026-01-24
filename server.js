import express from "express";
import authRoutes from "./src/routes/auth.js";
import projectRoutes from "./src/routes/projects.js";
import hoursRoutes from "./src/routes/hours.js";
import reportsRoutes from "./src/routes/reports.js";
import absenceRoutes from "./src/routes/absence.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import usersRoutes from "./src/routes/users.js";
import uploadRoutes from "./src/routes/upload.js";
import path from "path";
import errorHandler from "./src/middleware/errorHandler.js"
const app = express();
app.set("trust proxy", 1);
const allowedOrigins = ["http://localhost:5173", "https://totaltiming.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser tools (no origin) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
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
app.use("/api/absence", absenceRoutes);
app.use("/api", uploadRoutes);
app.listen(8800, () => console.log("API on :8800"));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve("uploads")));
app.use(errorHandler);