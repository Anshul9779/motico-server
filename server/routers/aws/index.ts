import express from "express";
import { authenticateToken } from "./../../routes/auth";
import { getAWSFileStream } from "./utils";
import multer from "multer";
import { uploadAWS } from "./handler";
import logger from "../../logger";

const upload = multer({
  dest: "uploads/",
});

// Handles all /api/aws routes

const router = express.Router();

router.post("/upload", authenticateToken, upload.single("file"), uploadAWS);

router.get("/*", (req, res) => {
  try {
    const awsKey = req.path.substring(1);
    const readStream = getAWSFileStream(awsKey);
    readStream.pipe(res);
  } catch (err) {
    logger.log("error", {
      timestamp: new Date().toISOString(),
      function: "routers.aws.index.router.get.callback",
      error: err,
      extra: { path: req.path },
    });
    return res.status(404);
  }
});

export default router;
