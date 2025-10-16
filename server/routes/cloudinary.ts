import { RequestHandler } from "express";
import crypto from "crypto";

export const handleSign: RequestHandler = (req, res) => {
  const {
    public_id,
    folder,
    eager,
  }: { public_id?: string; folder?: string; eager?: string } = req.body || {};

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res
      .status(500)
      .json({ error: "Cloudinary not configured on server." });
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Build params to sign
  const params: Record<string, string | number> = { timestamp };
  if (public_id) params.public_id = public_id;
  if (folder) params.folder = folder;
  if (eager) params.eager = eager;

  // Create the string to sign: sorted by key name
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  res.json({
    signature,
    apiKey,
    timestamp,
    cloudName,
  });
};
