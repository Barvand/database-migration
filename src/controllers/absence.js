import { db } from "../../connect.js";
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

// controllers/absence.js
export const GetAbsenceById = (req, res) => {
  const identifier = req.params.id; // This gets "1011" from the URL

  // Search by BOTH absenceCode and id to handle both cases
  const q = `
    SELECT id, name, description, totalHours, startDate, endDate, absenceCode
    FROM absence
    WHERE absenceCode = ? OR id = ?;
  `;

  db.query(q, [identifier, identifier], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Error fetching Absence" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Absence not found" });
    }
    return res.status(200).json(rows[0]);
  });
};

// controllers/absence.js
export const GetAbsenceByCode = (req, res) => {
  const identifier = req.params.id; // This gets "1011" from the URL

  // Search by BOTH absenceCode and id to handle both cases
  const q = `
   SELECT id, name, absenceCode, description
FROM absence
WHERE absenceCode = ?
LIMIT 1;
  `;

  db.query(q, [identifier, identifier], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Error fetching Absence" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Absence not found" });
    }
    return res.status(200).json(rows[0]);
  });
};
