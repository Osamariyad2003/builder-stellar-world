import { RequestHandler } from "express";
import crypto from "crypto";

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    const { file, filename, public_id, folder } = req.body || {};

    if (!file || typeof file !== "string") {
      return res.status(400).json({ error: "Missing 'file' in request body (data URL or remote URL expected)" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || null;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || null;
    const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || null;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET || null;

    if (!cloudName) {
      return res.status(500).json({ error: "Cloudinary cloud name not configured on server." });
    }

    // If server has API key+secret, perform a signed upload. Otherwise, if an upload preset is configured, perform unsigned upload using the preset.
    const signed = Boolean(apiKey && apiSecret);
    const unsignedWithPreset = !signed && Boolean(uploadPreset);

    if (!signed && !unsignedWithPreset) {
      return res.status(500).json({ error: "Cloudinary not configured on server. Provide CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET or CLOUDINARY_UPLOAD_PRESET." });
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    // Build a form to send to Cloudinary. Cloudinary accepts both multipart form-data and urlencoded; we use URLSearchParams for simplicity.
    const body = new URLSearchParams();
    body.append("file", file);
    if (filename) body.append("filename", filename);
    if (public_id) body.append("public_id", String(public_id));
    if (folder) body.append("folder", String(folder));

    if (signed) {
      const timestamp = Math.floor(Date.now() / 1000);
      const params: Record<string, string | number> = { timestamp };
      if (public_id) params.public_id = public_id;
      if (folder) params.folder = folder;

      const toSign = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&");

      const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

      body.append("api_key", String(apiKey));
      body.append("timestamp", String(timestamp));
      body.append("signature", signature);
    } else if (unsignedWithPreset) {
      body.append("upload_preset", String(uploadPreset));
    }

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
