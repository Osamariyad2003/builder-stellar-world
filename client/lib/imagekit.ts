// Minimal ImageKit client helper that posts file data (data URL or remote URL) to server endpoint

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

async function safeFetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init as any);
  let json = null;
  let text = "";
  try {
    json = await res.json();
  } catch (e) {
    try {
      text = await res.text();
    } catch {}
  }
  return { res, json, text } as const;
}

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
  const { res, json, text } = await safeFetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: filePayload, filename }),
  });

  if (!res.ok) {
    const msg = json ? JSON.stringify(json) : text || "";
    throw new Error(`ImageKit server upload failed: ${res.status} ${msg}`);
  }

  if (json && (json.url || json.filePath || json.name)) {
    // ImageKit returns 'url' or 'filePath', prefer url
    return json.url || json.filePath || json.name;
  }

  throw new Error("ImageKit server upload returned unexpected response.");
}
