import { db } from "../../connect.js";

export const uploadImage = (req, res) => {
  const { projectCode } = req.params;
  const userId = req.user.sub;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Convert projectCode → projectId
  db.query(
    "SELECT id FROM projects WHERE projectCode = ?",
    [projectCode],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      const projectId = rows[0].id;

      db.query(
        `
        INSERT INTO project_images (projectId, filename, uploadedBy)
        VALUES (?, ?, ?)
        `,
        [projectId, req.file.filename, userId],
        (err, result) => {
          if (err) {
            console.error("DB INSERT ERROR:", err);
            return res.status(500).json({ message: "DB error" });
          }

          res.status(201).json({
            id: result.insertId,
            projectId,
            projectCode,
            filename: req.file.filename,
          });
        },
      );
    },
  );
};
