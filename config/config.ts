import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import multer, { type FileFilterCallback } from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
import * as express from "express";

dotenv.config();

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
  throw new Error('Missing required AWS environment variables');
}

const bucket = "printease"

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
})

const fileFilter = (
  req: express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed.`));
  }
};

export const upload = multer({
    limits: { 
        fileSize: 10 * 1024 * 1024, 
        files: 1 
    },
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, { 
                fieldName: file.fieldname,
                originalName: file.originalname,
                uploadedAt: new Date().toISOString()
            });
        },
        key: (req, file, cb) => {
            const fileExtension = file.originalname.split('.').pop();
            const filename = `blippi/images/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
            cb(null, filename);
        },
    }),
    fileFilter,
});

const exportKey = (url: string) => {
  const parts = url.split(".amazonaws.com/");
  if (parts.length < 2) {
    throw new Error("Invalid S3 URL: " + url);
  }
  return parts[1];
}

export const deleteImage = async (imageUrl: string) => {
  try {

    const key = exportKey(imageUrl)

    await s3.send(new DeleteObjectCommand({Bucket:bucket, Key:key}))
  } catch (error) {
    console.log("Failed to delete image", error)
  }
}