import fs from "fs";
import { AuthenticatedRequest } from "./../../routes/auth";
import { promisify } from "util";
import { INCOMPLETE_DATA, INTERNAL_SERVER_ERROR } from "./../../errors";
import { s3FileUpload } from "./utils";
import { Response } from "express";

const deleteFile = promisify(fs.unlink);

interface MulterRequest extends AuthenticatedRequest {
  file: Express.Multer.File;
}

export const uploadAWS = async (req: MulterRequest, res: Response) => {
  try {
    const file = req.file;
    const key: string = req.body.key;
    const companyId = req.user.companyId;
    console.log(file);
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
  } catch (error) {
    console.log("error uploadAWS", error);
    return res.status(500).json(INTERNAL_SERVER_ERROR);
  }
};
