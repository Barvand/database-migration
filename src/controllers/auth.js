import { db } from "../../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

export const register = (req, res) => {
  // Check if user exists
  const q = "SELECT * FROM users WHERE username = ?";

  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length)
      return res.status(409).json({ message: "User already exists!" });

    // Create A New user
    //  Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(req.body.password, salt);

    const q =
      "INSERT INTO users(`username`,`email`,`password`,`name`) VALUES (?)";

    const values = [
      req.body.username,
      req.body.email,
      hashPassword,
      req.body.name,
    ];
    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json({ error: err.message });

      return res.status(200).json({ message: "User has been created." });
    });
  });
};

export const login = (req, res) => {
  // Logic for user login

  const q = "SELECT * FROM Users WHERE email = ?";

  db.query(q, [req.body.email], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    if (!checkPassword)
      return res.status(400).json({ message: "Wrong username or password!" });

    const token = jwt.sign({ id: data[0].id }, "secretkey");

    const { password, ...others } = data[0];

    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(others);
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