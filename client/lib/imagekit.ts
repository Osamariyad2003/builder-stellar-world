// Minimal ImageKit client helper that posts file data (data URL or remote URL) to server endpoint
import { fetchAndRead as sharedFetchAndRead } from "./cloudinary";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export async function uploadToImageKitServer(file: File | string, filename?: string): Promise<string> {
  // If file is File, read as data URL
  let filePayload: string;
  if (typeof file === "string") {
    filePayload = file;
  } else {
    filePayload = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(new Error("Failed to read file"));
      fr.readAsDataURL(file);
    });
  }

  const url = `${API_BASE}/api/imagekit/upload`;
  const { res, body } = await sharedFetchAndRead(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: filePayload, filename }),
  });

  if (!res.ok) {
    const msg = body?.json ? JSON.stringify(body.json) : body?.text || "";
    throw new Error(`ImageKit server upload failed: ${res.status} ${msg}`);
  }

  if (body.json && (body.json.url || body.json.filePath || body.json.name)) {
    // ImageKit returns 'url' or 'filePath', prefer url
    return body.json.url || body.json.filePath || body.json.name;
  }

  throw new Error("ImageKit server upload returned unexpected response.");
}
