import { db } from "../../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// 1) Define your schema
const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 chars")
    .max(30, "Username must be at most 30 chars")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 chars")
    // add your policy here:
    .regex(/[A-Z]/, "Password needs an uppercase letter")
    .regex(/[a-z]/, "Password needs a lowercase letter")
    .regex(/[0-9]/, "Password needs a number"),
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.enum(["user", "admin"]), // whatever roles you allow
});

// 2) Use the schema in your handler
export const register = (req, res) => {
  // Validate + transform
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

  // Safely use parsed + transformed data
  const { username, email, password, name, role } = parsed.data;

  // (Optional) sanitize for XSS if you ever render these values in HTML later.
  // e.g., using validator or sanitize-html. Zod doesn't sanitize HTML.
  // const cleanName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });

  const qCheck = "SELECT 1 FROM users WHERE username = ? OR email = ? LIMIT 1";
  db.query(qCheck, [username, email], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.length) {
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    const qInsert =
      "INSERT INTO users(`username`,`email`,`password`,`name`,`role`) VALUES (?)";
    const values = [username, email, hashPassword, name, role];

    db.query(qInsert, [values], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.status(200).json({ message: "User has been created." });
    });
  });
};

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const login = (req, res) => {
  // 2) Validate input
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

  // 3) Check user by email
  const q = "SELECT * FROM users WHERE email = ?";
  db.query(q, [email], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    const user = data[0];
    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch)
      return res.status(400).json({ message: "Invalid email or password!" });

    // 4) Sign JWT securely (use env variable, not a hardcoded key)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: "Server misconfigured: JWT_SECRET missing" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, secret, {
      expiresIn: "7d",
    });


    const { password: _, ...safeUser } = user;

    // 5) Send cookie and user data
    res
      .cookie("access_token", token, {
        httpOnly: true,
        sameSite: "none", // required for cross-site
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // optional: 7 days
        partitioned: true, // <- add if cookie is used in third-party context (Chrome)
      })
      .status(200)
      .json({ message: "Login successful", user: safeUser });
  });
};

export const logout = (req, res) => {
  // Logic for user logout
  res
    .clearCookie("access_token", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .json({ message: "User has been logged out." });
};
