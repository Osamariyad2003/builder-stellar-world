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
  const envApiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || null;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || null;

  // Allow the client to provide a public apiKey in the request body as a fallback
  const providedApiKey: string | null = (req.body && (req.body.apiKey || req.body.api_key)) || null;
  const apiKey = envApiKey || providedApiKey || null;

  if (!cloudName || !apiSecret) {
    // Provide detailed info to help debug missing envs, but avoid leaking secrets
    const missing: string[] = [];
    if (!cloudName) missing.push("CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_CLOUD_NAME");
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

  // Also expose these values in headers to support clients/extensions that may read response bodies
  // Headers are safe for public values (apiKey, cloudName) and signature/timestamp are needed.
  try {
    if (signature) res.setHeader("x-cloudinary-signature", signature);
    if (timestamp) res.setHeader("x-cloudinary-timestamp", String(timestamp));
    if (apiKey) res.setHeader("x-cloudinary-apikey", String(apiKey));
    if (cloudName) res.setHeader("x-cloudinary-cloudname", String(cloudName));
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET || null;
    if (preset) res.setHeader("x-cloudinary-upload-preset", String(preset));
  } catch (e) {
    // ignore header set failures
  }

  res.json({
    signature,
    apiKey,
    timestamp,
    cloudName,
  });
};
