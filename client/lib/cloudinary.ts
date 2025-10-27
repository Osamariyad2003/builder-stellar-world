export async function uploadImageToCloudinary(file: File): Promise<string> {
  let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // If build-time cloudName is missing (deployed without VITE_*), request runtime config from server
  if (!cloudName) {
    try {
      const cfgRes = await fetch("/api/cloudinary/config");
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        cloudName = cfg.cloudName || cloudName;
        uploadPreset = cfg.uploadPreset || uploadPreset;
      }
    } catch (e) {
      // ignore - will throw below if still missing
    }
  }

  if (!cloudName) {
    // Try localStorage fallback (temporary admin override in browser)
    try {
      const localCloud = localStorage.getItem("cloudinary.cloudName");
      const localPreset = localStorage.getItem("cloudinary.uploadPreset");
      if (localCloud) {
        cloudName = localCloud;
        uploadPreset = uploadPreset || localPreset || uploadPreset;
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }

  if (!cloudName) {
    throw new Error(
      "Cloudinary cloud name is not configured. Set VITE_CLOUDINARY_CLOUD_NAME in your environment or provide server config."
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  // Helper to safely read response bodies without causing 'body stream already read' errors
  async function readResponseBody(res: Response) {
    // If the body has already been used, provide a clear error message
    if ((res as any).bodyUsed) {
      throw new Error(
        "Response body already read (possibly by a browser extension). Disable extensions that inspect network requests and try again."
      );
    }

    // Prefer parsing JSON from a clone, fall back to text, and finally try to JSON.parse the text
    try {
      const cloned = res.clone();
      try {
        const json = await cloned.json();
        return { json, text: null } as const;
      } catch (e) {
        // Not JSON - fall through to text read on original response
      }
    } catch (e) {
      // clone may fail if body already read between response arrival and this call
      if ((res as any).bodyUsed) {
        throw new Error(
          "Response body already read (possibly by a browser extension). Disable extensions that inspect network requests and try again."
        );
      }
    }

    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return { json, text } as const;
      } catch (_) {
        return { json: null, text } as const;
      }
    } catch (e) {
      throw new Error("Could not read response body: " + String(e));
    }
  }

  // Use unsigned client-side upload if upload preset is configured
  if (uploadPreset) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);

    const res = await fetch(url, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const body = await readResponseBody(res).catch((err) => {
        // If we couldn't read the body, surface the error but include status
        throw new Error(`Cloudinary upload failed: ${res.status} - ${err.message}`);
      });

      const message = body?.json ? JSON.stringify(body.json) : body?.text || "";
      throw new Error(`Cloudinary upload failed: ${res.status} ${message}`);
    }

    const body = await readResponseBody(res);
    if (body.json && (body.json.secure_url || body.json.url)) {
      return body.json.secure_url || body.json.url;
    }

    // If response wasn't JSON or didn't include expected fields, try to parse text
    if (body.text && typeof body.text === "string" && body.text.startsWith("http")) {
      return body.text;
    }

    throw new Error("Cloudinary upload returned unexpected response.");
  }

  // Otherwise, request a signed signature from the application server
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!signRes.ok) {
    const body = await readResponseBody(signRes).catch((err) => {
      throw new Error(`Cloudinary signing failed: ${signRes.status} - ${err.message}`);
    });
    const message = body?.json ? JSON.stringify(body.json) : body?.text || "";
    throw new Error(`Cloudinary signing failed: ${signRes.status} ${message}`);
  }

  const signBody = await readResponseBody(signRes);
  const signData = signBody.json || {};
  const { signature, apiKey, timestamp } = signData as any;

  if (!signature || !apiKey || !timestamp) {
    throw new Error("Cloudinary signing endpoint returned invalid data.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await readResponseBody(res).catch((err) => {
      throw new Error(`Cloudinary signed upload failed: ${res.status} - ${err.message}`);
    });
    const message = body?.json ? JSON.stringify(body.json) : body?.text || "";
    throw new Error(`Cloudinary signed upload failed: ${res.status} ${message}`);
  }

  const body = await readResponseBody(res);
  if (body.json && (body.json.secure_url || body.json.url)) {
    return body.json.secure_url || body.json.url;
  }
  if (body.text && typeof body.text === "string" && body.text.startsWith("http")) {
    return body.text;
  }

  throw new Error("Cloudinary signed upload returned unexpected response.");
}

export function setLocalCloudinaryConfig(cloudName: string | null, uploadPreset?: string | null) {
  try {
    if (cloudName) localStorage.setItem("cloudinary.cloudName", cloudName);
    if (uploadPreset) localStorage.setItem("cloudinary.uploadPreset", uploadPreset);
  } catch (e) {
    console.warn("Could not persist Cloudinary config to localStorage", e);
  }
}
