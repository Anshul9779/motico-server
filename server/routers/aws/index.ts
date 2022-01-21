import express from "express";
import { authenticateToken } from "./../../routes/auth";
import { getAWSFileStream } from "./utils";
import multer from "multer";
import { uploadAWS } from "./handler";

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
    console.log("Error while accessing", req.path);
    console.log(err);
    return res.status(404);
  }
});

export default router;
