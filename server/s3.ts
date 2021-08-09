import S3 from "aws-sdk/clients/s3";
import fs from "fs";

const bucketName: string = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// Uploads file to s3

export const s3FileUpload = (file: Express.Multer.File, key: string) => {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: key,
  };

  return s3.upload(uploadParams).promise();
};

export const getAWSFileStream = (key: string) => {
  return s3
    .getObject({
      Bucket: bucketName,
      Key: key,
    })
    .createReadStream();
};
