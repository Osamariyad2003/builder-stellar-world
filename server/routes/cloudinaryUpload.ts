import { RequestHandler } from "express";
import crypto from "crypto";

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    const { file, filename, public_id, folder } = req.body || {};

    if (!file || typeof file !== "string") {
      return res.status(400).json({ error: "Missing 'file' in request body (data URL expected)" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || null;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || null;
    const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || null;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Cloudinary not configured on server." });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, string | number> = { timestamp };
    if (public_id) params.public_id = public_id;
    if (folder) params.folder = folder;

    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");

    const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

    // Build form-encoded body; Cloudinary accepts file as data URL in 'file' field
    const body = new URLSearchParams();
    body.append("file", file);
    if (filename) body.append("filename", filename);
    body.append("api_key", String(apiKey));
    body.append("timestamp", String(timestamp));
    body.append("signature", signature);
    if (public_id) body.append("public_id", String(public_id));
    if (folder) body.append("folder", String(folder));

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const resp = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await resp.text();
    try {
      const json = text ? JSON.parse(text) : {};
      return res.status(resp.status).json(json);
    } catch (e) {
      return res.status(resp.status).send(text);
    }
  } catch (err: any) {
    console.error("/api/cloudinary/upload error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
};
