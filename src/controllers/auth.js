// auth.controller.js
import { db } from "../../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterSchema, LoginSchema } from "../validation/schemas.js";

const IS_PROD = process.env.NODE_ENV === "production";

// Lifetimes
const ACCESS_TTL = "15m";
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days cookie
const REFRESH_TTL_JWT = "7d"; // match cookie lifetime
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Schemas

// Helpers
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL_JWT });
}
function setRefreshCookie(res, refreshToken) {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true, // true in prod (HTTPS required)
    sameSite: "none", // use "none" only if cross-site
    path: "/api/auth/refresh", // restrict path to auth routes
    maxAge: REFRESH_TTL_MS,
  });
}

// REGISTER
export const register = (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return res
      .status(400)
      .json({ message: "Validation failed", errors: issues });
  }
  const { username, email, password, name, role } = parsed.data;

  // Ensure DB has UNIQUE(username), UNIQUE(email)
  const qCheck = "SELECT 1 FROM users WHERE username = ? OR email = ? LIMIT 1";
  db.query(qCheck, [username, email], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.length)
      return res
        .status(409)
        .json({ message: "Username or email already exists" });

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    const qInsert =
      "INSERT INTO users(`username`,`email`,`password`,`name`,`role`) VALUES (?)";
    const values = [username, email, hashPassword, name, role];

    db.query(qInsert, [values], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      return res.status(201).json({ message: "User created" });
    });
  });
};

// LOGIN → returns access token in JSON + sets refresh cookie
export const login = (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return res
      .status(400)
      .json({ message: "Validation failed", errors: issues });
  }
  const { email, password } = parsed.data;

  const q =
    "SELECT userId, username, email, password, name, role FROM users WHERE email = ? LIMIT 1";
  db.query(q, [email], (err, data) => {
    if (err) {
      console.error("❌ MySQL error in login:", err);
      return res.status(500).json({ error: err.message || err });
    }
    if (data.length === 0)
      return res.status(404).json({ message: "Invalid email or password" });

    const user = data[0];
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok)
      return res.status(400).json({ message: "Invalid email or password" });

    // prepare safe user
    const { password: _pw, ...safeUser } = user;

    // claims you actually need in access token
    const accessToken = signAccessToken({ sub: user.userId, role: user.role });
    const refreshToken = signRefreshToken({
      sub: user.userId,
      token_use: "refresh",
    });

    setRefreshCookie(res, refreshToken);

    // FRONTEND stores access token in memory and uses Authorization header
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: safeUser,
    });
  });
};

export const refresh = (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ message: "Missing refresh token" });

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);

    // Query DB to get current role
    const q = "SELECT role FROM users WHERE userId = ? LIMIT 1";
    db.query(q, [payload.sub], (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      if (data.length === 0)
        return res.status(401).json({ message: "User not found" });

      const accessToken = signAccessToken({
        sub: payload.sub,
        role: data[0].role,
      });
      return res.status(200).json({ accessToken });
    });
  } catch (e) {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
};

// LOGOUT → clear refresh cookie (access token just expires)
export const logout = (req, res) => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/api/auth/refresh",
  });
  return res.status(200).json({ message: "Logged out" });
};

// GET /auth/me  (requires access token in Authorization header)
export const me = (req, res) => {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");
  if (!token)
    return res.status(401).json({ message: "Missing Authorization header" });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Load the user if you need fresh DB fields; or return claims only:
    const q =
      "SELECT userId, username, email, name, role FROM users WHERE userId = ? LIMIT 1";
    db.query(q, [payload.sub], (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      if (data.length === 0)
        return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ user: data[0] });
    });
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};
