// controllers/projects.js
import jwt from "jsonwebtoken";
import { db } from "../../connect.js";

// ---- GET /projects  (all projects) ----------------------------------------
export const GetProjects = (req, res) => {
  const q = `
    SELECT id, name, description, status, totalHours, startDate, endDate
    FROM projects
    ORDER BY COALESCE(startDate, '0001-01-01') DESC, id DESC;
  `;
  db.query(q, (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error fetching projects" });
    return res.status(200).json(rows);
  });
};

// ---- GET /projects/:id  (single project) ----------------------------------
export const GetProjectById = (req, res) => {
  const q = `
    SELECT id, name, description, status, totalHours, startDate, endDate
    FROM projects
    WHERE id = ?;
  `;
  db.query(q, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching project" });
    if (rows.length === 0)
      return res.status(404).json({ message: "Project not found" });
    return res.status(200).json(rows[0]);
  });
};

// ---- POST /projects  (create) ---------------------------------------------
export const addProject = (req, res) => {
  const {
    name,
    description = null,
    status = "Active",
    totalHours = null,
    startDate = null,
    endDate = null,
  } = req.body;

  // Basic validation
  if (!name) return res.status(400).json({ message: "Name is required" });

  const q = `
    INSERT INTO projects (\`name\`, \`description\`, \`status\`, \`totalHours\`, \`startDate\`, \`endDate\`)
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  const values = [name, description, status, totalHours, startDate, endDate];

  db.query(q, values, (err) => {
    if (err) return res.status(500).json({ message: "Error creating project, please fill in all fields" });
    return res.status(201).json({ message: "Project has been created" });
  });
};

// ---- PATCH /projects/:id  (partial update) --------------------------------
export const updateProject = (req, res) => {
  const allowed = [
    "name",
    "description",
    "status",
    "totalHours",
    "startDate",
    "endDate",
  ];
  const sets = [];
  const vals = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      sets.push(`\`${key}\` = ?`);
      vals.push(req.body[key]);
    }
  }
  if (sets.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const id = req.params.id;
  const q = `UPDATE projects SET ${sets.join(", ")} WHERE id = ?;`;
  vals.push(id);

  db.query(q, vals, (err, result) => {
    if (err) return res.status(500).json({ message: "Error updating project" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    db.query(
      `SELECT id, name, description, status, totalHours, startDate, endDate
       FROM projects WHERE id = ?`,
      [id],
      (err2, rows) => {
        if (err2 || rows.length === 0) {
          return res.status(200).json({ message: "Project updated" });
        }
        return res.status(200).json(rows[0]); // <— return updated row
      }
    );
  });
};

// ---- DELETE /projects/:id  (delete) ---------------------------------------
export const deleteProject = (req, res) => {
  const q = `DELETE FROM projects WHERE id = ?;`;
  db.query(q, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting project" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Project not found" });
    return res.status(200).json({ message: "Project has been deleted" });
  });
};

// ---- Optional: list active projects (status + date) -----------------------
export const getActiveProjects = (req, res) => {
  const q = `
    SELECT id, name, description, status, totalHours, startDate, endDate
    FROM projects
    WHERE status = 'Active'
      AND (endDate IS NULL OR endDate >= CURDATE())
    ORDER BY startDate DESC, id DESC;
  `;
  db.query(q, (err, rows) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error fetching active projects" });
    return res.status(200).json(rows);
  });
};
