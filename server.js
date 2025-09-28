import "dotenv/config";
import express from "express";
import authRoutes from "./src/routes/auth.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth/", authRoutes);
app.listen(8800, () => console.log("API on :8800"));