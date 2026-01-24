import multer from "multer";

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Image must be smaller than 5MB",
      });
    }

    return res.status(400).json({
      message: err.message,
    });
  }

  return res.status(500).json({
    message: "Unexpected server error",
  });
};

export default errorHandler;