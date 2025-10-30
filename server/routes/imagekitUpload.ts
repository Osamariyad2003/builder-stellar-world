import { RequestHandler } from "express";

export const handleImageKitUpload: RequestHandler = async (req, res) => {
  try {
    const { file, filename, folder } = req.body || {};

    if (!file || typeof file !== "string") {
      return res
        .status(400)
        .json({
          error:
            "Missing 'file' in request body (data URL or remote URL expected)",
        });
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || null;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || null;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || null; // optional

    if (!privateKey) {
      return res
        .status(500)
        .json({
          error:
            "ImageKit not configured on server. Provide IMAGEKIT_PRIVATE_KEY.",
        });
    }

    const uploadUrl = `https://upload.imagekit.io/api/v1/files/upload`;

    const params = new URLSearchParams();
    params.append("file", file);
    if (filename) params.append("fileName", String(filename));
    if (folder) params.append("folder", String(folder));
    if (publicKey) params.append("publicKey", String(publicKey));
    if (urlEndpoint) params.append("urlEndpoint", String(urlEndpoint));

    const basic = Buffer.from(`${privateKey}:`).toString("base64");

    const resp = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: params.toString(),
    });

    const text = await resp.text();

    // Log the upstream response for debugging when upload fails
    if (!resp.ok) {
      console.error(
        `/api/imagekit/upload: upstream returned ${resp.status} - ${text}`,
      );
      // Try to parse JSON error body if possible
      try {
        const jsonErr = text ? JSON.parse(text) : { message: text };
        return res
          .status(resp.status)
          .json({ error: "ImageKit upload failed", details: jsonErr });
      } catch (parseErr) {
        return res
          .status(resp.status)
          .json({ error: "ImageKit upload failed", details: text });
      }
    }

    try {
      const json = text ? JSON.parse(text) : {};
      return res.status(resp.status).json(json);
    } catch (e) {
      return res.status(resp.status).send(text);
    }
  } catch (err: any) {
    console.error("/api/imagekit/upload error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
};
