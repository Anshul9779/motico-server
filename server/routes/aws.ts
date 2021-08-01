import { AuthenticatedRequest } from "./auth";
import fs from "fs";
import { promisify } from "util";
import { Response } from "express";
import { INCOMPLETE_DATA } from "./../errors";
import { s3FileUpload } from "./../s3";

const deleteFile = promisify(fs.unlink);

interface MulterRequest extends AuthenticatedRequest {
  file: Express.Multer.File;
}

export const uploadAWS = async (req: MulterRequest, res: Response) => {
  const file = req.file;
  const key: string = req.body.key;
  const companyId = req.user.companyId;
  if (!key) {
    deleteFile(file.path);
    return res.json(INCOMPLETE_DATA);
  }

  const extension = file.originalname.split(".").pop();

  const uploadDetails = await s3FileUpload(
    file,
    `${companyId}/${key}.${extension}`
  );
  console.log(file, uploadDetails);
  deleteFile(file.path);
  return res.json(uploadDetails);
};
