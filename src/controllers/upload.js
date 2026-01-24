import { db } from "../../connect.js";
import fs from "fs";
import path from "path";

export const uploadImage = (req, res) => {
  const { projectCode } = req.params;
  const userId = req.user.sub;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  console.log("REQ.FILES:", req.files);
  
  db.query(
    "SELECT id FROM projects WHERE projectCode = ?",
    [projectCode],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      const projectId = rows[0].id;
    console.log(projectId)
      const values = req.files.map((file) => [
        projectId,
        file.filename,
        userId,
      ]);

      db.query(
        `
        INSERT INTO project_images (projectId, filename, uploadedBy)
        VALUES ?
        `,
        [values],
        (err) => {
          if (err) {
            console.error("DB INSERT ERROR:", err);
            return res.status(500).json({ message: "DB error" });
          }

          console.log("REQ.FILES:", req.files);

          res.status(201).json({
            uploaded: values.length,
            projectId,
            projectCode,
            files: req.files.map((f) => f.filename),
          });
        }
      );
    }
  );
};


export const deleteImage = (req, res) => {
  const { imageId } = req.params;
  const userId = req.user.sub;

  // Get image info first
  db.query(
    "SELECT filename, uploadedBy FROM project_images WHERE id = ?",
    [imageId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (rows.length === 0) {
        return res.status(404).json({ message: "Image not found" });
      }

      const image = rows[0];

      // Optional: only uploader can delete
      if (image.uploadedBy !== userId) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const filePath = path.resolve("uploads", image.filename);

      // Delete DB record
      db.query(
        "DELETE FROM project_images WHERE id = ?",
        [imageId],
        (err) => {
          if (err) return res.status(500).json({ message: "DB error" });

          // Delete file (ignore if already gone)
          fs.unlink(filePath, () => {});

          res.json({ success: true });
        }
      );
    }
  );
};
