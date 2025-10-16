import { RequestHandler } from "express";

export const handleConfig: RequestHandler = (_req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || null;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || null;

  if (!cloudName && !uploadPreset) {
    return res
      .status(404)
      .json({ error: "No Cloudinary configuration available on server." });
  }

  res.json({ cloudName, uploadPreset });
};
