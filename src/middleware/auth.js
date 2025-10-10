import jwt from "jsonwebtoken";
const requireAuth = (req, res, next) => {
  // Prefer Authorization header, fallback to cookie for flexibility
  const auth = req.headers.authorization || "";
  const headerToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const cookieToken = req.cookies?.access_token || null;
  const token = headerToken || cookieToken;

  if (!token) return res.status(401).json({ message: "Not logged in!" });

  jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET || "secretkey",
    (err, userInfo) => {
      if (err) return res.status(403).json({ message: "Token is not valid" });
      req.user = userInfo;
      next();
    }
  );
};
export const auth = requireAuth;
