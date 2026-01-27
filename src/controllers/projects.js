// controllers/projects.js
import { db } from "../../connect.js";

// ---- GET /projects  (all projects) ----------------------------------------
export const GetProjects = (req, res) => {
  const q = `
    SELECT id, name, description, status, totalHours, startDate, endDate, projectCode
    FROM projects
    ORDER BY COALESCE(startDate, '0001-01-01') DESC, id DESC;
  `;
  db.query(q, (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Error fetching projects" });
    return res.status(200).json(rows);
  });
};

// controllers/projects.js
export const GetProjectById = (req, res) => {
  const identifier = req.params.id; // This gets "1011" from the URL

  // Search by BOTH projectCode and id to handle both cases
  const q = `
    SELECT id, name, description, status, totalHours, startDate, endDate, projectCode
    FROM projects
    WHERE projectCode = ? OR id = ?;
  `;

  db.query(q, [identifier, identifier], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Error fetching project" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.status(200).json(rows[0]);
  });
};

// ---- POST /projects  (create) ---------------------------------------------
export const addProject = (req, res) => {
  const {
    name,
    description = null,
    status = "active",
    totalHours = null,
    startDate = null,
    endDate = null,
    projectCode = null,
  } = req.body;

  // Basic validation
  if (!name?.trim()) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      field: "name",
      message: "Name is required",
    });
  }

  if (!projectCode?.toString().trim()) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      field: "projectCode",
      message: "Project code is required",
    });
  }

  const q = `
    INSERT INTO projects (\`name\`, \`description\`, \`status\`, \`totalHours\`, \`startDate\`, \`endDate\`, \`projectCode\`)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;

  const values = [
    name,
    description,
    status,
    totalHours,
    startDate,
    endDate,
    projectCode,
  ];

  db.query(q, values, (err, result) => {
    if (err) {
      console.error("Database error:", err);

      // ✅ Duplicate key (unique constraint)
      if (err.code === "ER_DUP_ENTRY") {
        // Optional: try to figure out which field caused it
        const msg = String(err.sqlMessage || "");
        const isProjectCode = msg.includes("projectCode");

        return res.status(409).json({
          code: isProjectCode ? "PROJECT_CODE_EXISTS" : "DUPLICATE_ENTRY",
          field: isProjectCode ? "projectCode" : undefined,
          message: isProjectCode
            ? "Project code already exists"
            : "Det er allerede et prosjekt med denne verdien.",
        });
      }

      // ✅ Other DB errors
      return res.status(500).json({
        code: "DB_ERROR",
        message: "Error creating project",
      });
    }

    // Better: return created record id too
    return res.status(201).json({
      message: "Project has been created",
      id: result.insertId,
    });
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
    "projectCode",
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
      `SELECT id, name, description, status, totalHours, startDate, endDate, projectCode
       FROM projects WHERE id = ?`,
      [id],
      (err2, rows) => {
        if (err2 || rows.length === 0) {
          return res.status(200).json({ message: "Project updated" });
        }
        return res.status(200).json(rows[0]);
      },
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
    SELECT id, name, description, status, totalHours, startDate, endDate, projectCode
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

// ---- GET /projects/:id/images ---------------------------------------------
export const getProjectImages = (req, res) => {
  const { projectCode } = req.params;

  const q = `
    SELECT
      pi.id,
      pi.filename,
      pi.createdAt,
      pi.uploadedBy
    FROM project_images pi
    JOIN projects p ON p.id = pi.projectId
    WHERE p.projectCode = ?
    ORDER BY pi.createdAt DESC;
  `;

  db.query(q, [projectCode], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "Error fetching images" });
    }

    const BASE_URL = "https://api.totaltiming.app";

    res.status(200).json(
      rows.map((img) => ({
        id: img.id,
        filename: img.filename,
        createdAt: img.createdAt,
        url: `${BASE_URL}/uploads/${img.filename}`,
        uploadedBy: img.uploadedBy,
      })),
    );
  });
};
