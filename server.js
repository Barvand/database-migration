import "dotenv/config";
import express from "express";
import authRoutes from "./src/routes/auth.js";
import projectRoutes from "./src/routes/projects.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
  "https://manhours.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

const corsOptions = {
  origin(origin, cb) {
    // allow non-browser tools (no Origin header) and exact matches
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // set to false if you're NOT using cookies
};

app.use(cors(corsOptions));

// Explicitly answer preflight before any auth
app.options("*", cors(corsOptions));

// (optional but helpful for caches/CDNs)
app.use((_, res, next) => {
  res.header("Vary", "Origin");
  next();
});
app.get("/api/health", async (_req, res) => res.json({ ok: true }));

app.use(express.json());
app.use(cookieParser());
app.use("/api/projects", projectRoutes);
app.use("/api/auth/", authRoutes);
app.listen(8800, () => console.log("API on :8800"));
