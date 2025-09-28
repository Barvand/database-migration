import "dotenv/config";
import express from "express";
import authRoutes from "./src/routes/auth.js";
import commentsRoutes from "./src/routes/comments.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import postRoutes from "./src/routes/posts.js";
import likesRoutes from "./src/routes/likes.js";
import usersRoutes from "./src/routes/users.js";
import relationshipRoutes from "./src/routes/relationship.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth/", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/relationships", relationshipRoutes);

app.listen(8800, () => console.log("API on :8800"));