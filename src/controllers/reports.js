// controllers/reports.js
import { db } from "../../connect.js";

const HOURS_EXPR =
  "(TIMESTAMPDIFF(MINUTE, h.startTime, h.endTime) - COALESCE(h.breakMinutes,0))/60";

function buildDateWhere(from, to) {
  const where = [];
  const vals = [];
  if (from) {
    where.push("h.startTime >= ?");
    vals.push(`${from} 00:00:00`);
  }
  if (to) {
    where.push("h.startTime < DATE_ADD(?, INTERVAL 1 DAY)");
    vals.push(to);
  }
  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", vals };
}

export const hoursByUserProject = (req, res) => {
  const { from, to } = req.query;
  const { where, vals } = buildDateWhere(from, to);

  const q = `
    SELECT
      h.userId,
      u.name  AS userName,
      h.projectsId AS projectId,
      p.name  AS projectName,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN users u    ON u.userId = h.userId
    JOIN projects p ON p.id     = h.projectsId
    ${where}
    GROUP BY h.userId, h.projectsId
    ORDER BY userName, projectName;
  `;

  db.query(q, vals, (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error generating report" });
    res.json(rows);
  });
};

export const hoursByUser = (req, res) => {
  const q = `
    SELECT
      h.userId,
      u.name AS userName,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN users u ON u.userId = h.userId
    GROUP BY h.userId
    ORDER BY userName;
  `;

  db.query(q, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Error generating report" });
    }
    res.json(rows);
  });
};

export const hoursByProject = (req, res) => {
  const { from, to } = req.query;
  const { where, vals } = buildDateWhere(from, to);

  const q = `
    SELECT
      h.projectsId AS projectId,
      p.name AS projectName,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN projects p ON p.id = h.projectsId
    ${where}
    GROUP BY h.projectsId
    ORDER BY projectName;
  `;

  db.query(q, vals, (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error generating report" });
    res.json(rows);
  });
};

export const projectHoursDetail = (req, res) => {
  const { projectId } = req.params;
  const { from, to, userId } = req.query;

  const { where, vals } = buildDateWhere(from, to);
  const userFilter = userId ? "AND h.userId = ?" : "";
  const userVals = userId ? [userId] : [];

  const q = `
    SELECT
      h.idHours,
      h.userId,
      u.name       AS userName,
      h.projectsId AS projectId,
      p.name       AS projectName,
      h.startTime,
      h.endTime,
      h.breakMinutes,
      ROUND(${HOURS_EXPR}, 2) AS hoursWorked,
      h.note
    FROM hours h
    JOIN users u    ON u.userId = h.userId
    JOIN projects p ON p.id     = h.projectsId
    WHERE h.projectsId = ?
    ${where}
    ${userFilter}
    ORDER BY h.startTime DESC, h.idHours DESC;
  `;

  db.query(q, [projectId, ...vals, ...userVals], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error generating report" });
    res.json(rows);
  });
};

/* ---------- NEW: Per-project summary grouped by user ---------- */
export const projectHoursByUser = (req, res) => {
  const { projectId } = req.params;
  const { from, to } = req.query;

  const { where, vals } = buildDateWhere(from, to);

  const q = `
    SELECT
      h.userId,
      u.name AS userName,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN users u ON u.userId = h.userId
    WHERE h.projectsId = ?
    ${where}
    GROUP BY h.userId
    ORDER BY userName;
  `;

  db.query(q, [projectId, ...vals], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error generating report" });
    res.json(rows);
  });
};
