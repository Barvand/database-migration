import { db } from "../../connect.js";

export const getUsers = (req, res) => {
  const q = `
    SELECT userId, name, role
    FROM users
    ORDER BY name ASC;
  `;

  db.query(q, (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res
        .status(500)
        .json({ message: "Error fetching users", error: err.message });
    }
    return res.status(200).json(rows);
  });
};
