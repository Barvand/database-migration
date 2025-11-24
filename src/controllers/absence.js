export const getAbsence = (req, res) => {
  const q = "SELECT * FROM absence";

  db.query(q, (err, rows) => {
    if (err) {
      console.error("[getAbsence] SQL error:", err);
      return res.status(500).json({ message: "Error fetching absence list" });
    }

    return res.status(200).json(rows);
  });
};
