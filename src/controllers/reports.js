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

function buildDateAnd(from, to) {
  const parts = [];
  const vals = [];

  if (from) {
    parts.push("h.startTime >= ?");
    vals.push(`${from} 00:00:00`);
  }
  if (to) {
    parts.push("h.startTime < DATE_ADD(?, INTERVAL 1 DAY)");
    vals.push(to);
  }

  return {
    sql: parts.length ? `AND ${parts.join(" AND ")}` : "",
    vals,
  };
}

export const hoursByUserProject = (req, res) => {
  const { from, to } = req.query;
  const { where, vals } = buildDateWhere(from, to);

  const q = `
    SELECT
      h.userId,
      u.name  AS name,
      h.projectsId AS projectId,
      p.name  AS projectName,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN users u    ON u.userId = h.userId
    JOIN projects p ON p.id     = h.projectsId
    ${where}
    GROUP BY h.userId, h.projectsId
    ORDER BY name, projectName;
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
      u.name AS name,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN users u ON u.userId = h.userId
    GROUP BY h.userId
    ORDER BY name;
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
      u.name       AS name,
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
      u.name AS name,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN users u ON u.userId = h.userId
    WHERE h.projectsId = ?
    ${where}
    GROUP BY h.userId
    ORDER BY name;
  `;

  db.query(q, [projectId, ...vals], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error generating report" });
    res.json(rows);
  });
};

export const absenceHoursDetail = (req, res) => {
  const { absenceId } = req.params;
  const { from, to, userId } = req.query;
  console.log("absence param:", req.params);

  const date = buildDateAnd(from, to);
  const userFilter = userId ? "AND h.userId = ?" : "";
  const userVals = userId ? [userId] : [];

  const q = `
    SELECT
      h.idHours,
      h.userId,
      u.name        AS name,
      h.absenceId   AS absenceId,
      a.name        AS absenceName,
      a.absenceCode AS absenceCode,
      h.startTime,
      h.endTime,
      h.breakMinutes,
      ROUND(${HOURS_EXPR}, 2) AS hoursWorked,
      h.note
    FROM hours h
    JOIN users u   ON u.userId = h.userId
    JOIN absence a ON a.id     = h.absenceId
    WHERE h.absenceId = ?
    ${date.sql}
    ${userFilter}
    ORDER BY h.startTime DESC, h.idHours DESC;
  `;

  db.query(q, [absenceId, ...date.vals, ...userVals], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error generating report" });
    res.json(rows);
  });
};
export const absenceHoursByUser = (req, res) => {
  const { absenceId } = req.params;
  const { from, to } = req.query;

  const date = buildDateAnd(from, to);

  const q = `
    SELECT
      h.userId,
      u.name AS name,
      ROUND(SUM(${HOURS_EXPR}), 2) AS totalHours
    FROM hours h
    JOIN users u   ON u.userId = h.userId
    JOIN absence a ON a.id     = h.absenceId
    WHERE a.absenceCode = ?
    ${date.sql}
    GROUP BY h.userId
    ORDER BY name;
  `;

  db.query(q, [absenceId, ...date.vals], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error generating report" });
    res.json(rows);
  });
};
