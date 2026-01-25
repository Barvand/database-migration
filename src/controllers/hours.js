// controllers/hours.js
import { db } from "../../connect.js";

// Use a parameterized expression for inserts (can't reliably reference columns in VALUES)
const SQL_WORKED_EXPR_PARAMS =
  "(TIMESTAMPDIFF(MINUTE, ?, ?) - COALESCE(?, 0)) / 60";
const SQL_WORKED_EXPR_FROM_COLS =
  "(TIMESTAMPDIFF(MINUTE, startTime, endTime) - COALESCE(breakMinutes, 0)) / 60";

// ---- GET /hours  (all, with optional filters) ------------------------------
export const getHours = (req, res) => {
  const { userId, projectsId } = req.query;
  const where = [];
  const vals = [];

  if (userId) {
    where.push("h.userId = ?");
    vals.push(userId);
  }
  if (projectsId) {
    where.push("h.projectsId = ?");
    vals.push(projectsId);
  }

  const q = `
    SELECT
      h.idHours,
      h.userId,
      h.projectsId,
      h.startTime,
      h.endTime,
      h.breakMinutes,
      h.absenceId,
      ${SQL_WORKED_EXPR_FROM_COLS} AS hoursWorked
    FROM hours h
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY h.startTime DESC, h.idHours DESC;
  `;

  db.query(q, vals, (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching hours" });
    return res.status(200).json(rows);
  });
};

// ---- GET /hours/:id  (single) ---------------------------------------------
export const getHourById = (req, res) => {
  const q = `
    SELECT
      h.idHours,
      h.userId,
      h.projectsId,
      h.startTime,
      h.endTime,
      h.breakMinutes,
      h.absenceId,
      ${SQL_WORKED_EXPR_FROM_COLS} AS hoursWorked
    FROM hours h
    WHERE h.idHours = ?;
  `;
  db.query(q, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching hour" });
    if (rows.length === 0)
      return res.status(404).json({ message: "Hour not found" });
    return res.status(200).json(rows[0]);
  });
};

// controllers/hours.js (only the changed parts)

// helper: convert ISO -> 'YYYY-MM-DD HH:MM:SS'
function toMySQLDateTime(iso) {
  // if you already have a Date, pass it directly
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const MM = pad(d.getMinutes());
  const SS = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

// ---- POST /hours  (create) -------------------------------------------------
export const addHour = (req, res) => {
  const { userId, projectsId, startTime, endTime, breakMinutes, absenceId } =
    req.body;

  if (!userId || !startTime || !endTime) {
    return res.status(400).json({
      message: "userId, startTime, endTime are required",
    });
  }

  // Determine which type of entry this is
  const hasProject =
    projectsId !== null && projectsId !== undefined && projectsId !== "";
  const hasAbsence =
    absenceId !== null && absenceId !== undefined && absenceId !== "";

  // Must be exactly one
  if (hasProject === hasAbsence) {
    return res.status(400).json({
      message: "Du må velge enten et prosjekt eller fravær.",
    });
  }

  // Convert ISO -> MySQL datetime
  const startSQL = toMySQLDateTime(startTime);
  const endSQL = toMySQLDateTime(endTime);

  const q = `
  INSERT INTO hours (
    userId,
    projectsId,
    absenceId,
    startTime,
    endTime,
    breakMinutes
  )
  VALUES (?, ?, ?, ?, ?, ?);
`;

  const vals = [
    userId,
    hasProject ? projectsId : null,
    hasAbsence ? absenceId : null,
    startSQL,
    endSQL,
    breakMinutes ?? 0,
  ];

  db.query(q, vals, (err, result) => {
    if (err) {
      console.error("[addHour] SQL error:", err);
      return res.status(500).json({ message: "Error creating hour" });
    }

    const selectQ = `
      SELECT
        h.idHours,
        h.userId,
        h.projectsId,
        h.absenceId,
        h.startTime,
        h.endTime,
        h.breakMinutes,
        (TIMESTAMPDIFF(MINUTE, h.startTime, h.endTime) -
         COALESCE(h.breakMinutes, 0)) / 60 AS hoursWorked
      FROM hours h
      WHERE h.idHours = ?;
    `;

    db.query(selectQ, [result.insertId], (err2, rows) => {
      if (err2) return res.status(201).json({ idHours: result.insertId });
      return res.status(201).json(rows[0]);
    });
  });
};

// ---- PUT /hours/:id  (partial update) -----------------------------------
export const updateHour = (req, res) => {
  const allowed = [
    "startTime",
    "endTime",
    "breakMinutes",
    "userId",
    "projectsId",
    "absenceId",
  ];

  const sets = [];
  const vals = [];

  // Build dynamic SET clause
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      const v =
        k === "startTime" || k === "endTime"
          ? toMySQLDateTime(req.body[k])
          : req.body[k];
      sets.push(`\`${k}\` = ?`);
      vals.push(v);
    }
  }

  // Enforce rule: must choose EITHER project OR absence
  const { projectsId, absenceId } = req.body;
  if (
    (projectsId && absenceId) ||
    (projectsId === null && absenceId === null)
  ) {
    return res.status(400).json({
      message: "You must update either projectsId OR absenceId — not both.",
    });
  }

  if (sets.length === 0)
    return res.status(400).json({ message: "No fields to update" });

  const q = `UPDATE hours SET ${sets.join(", ")} WHERE idHours = ?;`;
  vals.push(req.params.id);

  db.query(q, vals, (err, result) => {
    if (err) {
      console.error("[updateHour] SQL error:", err);
      return res.status(500).json({ message: "Error updating hour" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Hour not found" });

    const selectQ = `
      SELECT
        h.idHours,
        h.userId,
        h.projectsId,
        h.absenceId,
        h.startTime,
        h.endTime,
        h.breakMinutes,
        (TIMESTAMPDIFF(MINUTE, h.startTime, h.endTime) - COALESCE(h.breakMinutes, 0)) / 60 AS hoursWorked
      FROM hours h
      WHERE h.idHours = ?;
    `;
    db.query(selectQ, [req.params.id], (err2, rows) => {
      if (err2) return res.status(200).json({ message: "Hour updated" });
      return res.status(200).json(rows[0]);
    });
  });
};

// ---- DELETE /hours/:id  (delete) ------------------------------------------
export const deleteHour = (req, res) => {
  const q = `DELETE FROM hours WHERE idHours = ?;`;
  db.query(q, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting hour" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Hour not found" });
    return res.status(200).json({ message: "Hour has been deleted" });
  });
};

// ---- Optional: GET /users/:userId/hours  ----------------------------------
export const getHoursByUser = (req, res) => {
  req.query.userId = req.params.userId;
  return getHours(req, res);
};

// ---- Optional: GET /projects/:projectId/hours-list ------------------------
export const getHoursByProject = (req, res) => {
  req.query.projectsId = req.params.projectId;
  return getHours(req, res);
};
