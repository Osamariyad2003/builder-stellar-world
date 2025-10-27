import { RequestHandler } from "express";
import crypto from "crypto";

export const handleSign: RequestHandler = (req, res) => {
  const {
    public_id,
    folder,
    eager,
  }: { public_id?: string; folder?: string; eager?: string } = req.body || {};

  // Support common env var names and fallbacks so deploys that set VITE_* or CLOUDINARY_* still work
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || null;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || null;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || null;

  if (!cloudName || !apiKey || !apiSecret) {
    // Provide detailed info to help debug missing envs, but avoid leaking secrets
    const missing: string[] = [];
    if (!cloudName) missing.push("CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_CLOUD_NAME");
    if (!apiKey) missing.push("CLOUDINARY_API_KEY / VITE_CLOUDINARY_API_KEY");
    if (!apiSecret) missing.push("CLOUDINARY_API_SECRET / VITE_CLOUDINARY_API_SECRET");

    return res
      .status(500)
      .json({ error: "Cloudinary not configured on server.", missing });
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
