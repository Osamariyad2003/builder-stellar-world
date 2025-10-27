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

  // Helper to fetch and safely read response; retry once if a body-used error occurs (often caused by extensions)
  async function fetchAndRead(input: RequestInfo, init?: RequestInit) {
    const attempt = async () => {
      const res = await fetch(input, init as any);
      const bodyResult = await readResponseBody(res).catch((err) => {
        // rethrow for caller to handle
        throw err;
      });
      return { res, body: bodyResult } as const;
    };

    try {
      return await attempt();
    } catch (err: any) {
      const msg = String(err?.message || err || "").toLowerCase();
      if (msg.includes("response body already read") || msg.includes("body already read")) {
        // retry once with cache-bypass
        const urlStr = typeof input === "string" ? input : (input as Request).url;
        const retryUrl = urlStr + (urlStr.includes("?") ? `&_retry=${Date.now()}` : `?_retry=${Date.now()}`);
        try {
          const res = await fetch(retryUrl, init as any);
          const bodyResult = await readResponseBody(res);
          return { res, body: bodyResult } as const;
        } catch (err2) {
          // surface original error if retry fails
          throw err;
        }
      }
      throw err;
    }
  }

  // Use unsigned client-side upload if upload preset is configured
  if (uploadPreset) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);

    const { res: uploadRes, body } = await fetchAndRead(url, {
      method: "POST",
      body: form,
    });

    if (!uploadRes.ok) {
      const message = body?.json ? JSON.stringify(body.json) : body?.text || "";
      throw new Error(`Cloudinary upload failed: ${uploadRes.status} ${message}`);
    }

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
  let signRes, signBody;
  try {
    const out = await fetchAndRead("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    signRes = out.res;
    signBody = out.body;
  } catch (err: any) {
    const msg = String(err?.message || err || "");
    // If the response body was already read (often by extensions), try to fall back to unsigned upload preset
    if (msg.toLowerCase().includes("response body already read") || msg.toLowerCase().includes("body already read")) {
      // Try server config for an unsigned upload preset
      try {
        const cfgRes = await fetch("/api/cloudinary/config");
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          const serverPreset = cfg.uploadPreset || cfg.upload_preset || null;
          if (serverPreset) {
            // Use unsigned flow as fallback
            const form = new FormData();
            form.append("file", file);
            form.append("upload_preset", serverPreset);

            const uploadRes = await fetch(url, { method: "POST", body: form });
            if (!uploadRes.ok) {
              const text = await uploadRes.text().catch(() => "");
              throw new Error(`Cloudinary upload fallback failed: ${uploadRes.status} ${text}`);
            }
            const data = await uploadRes.json().catch(() => null);
            if (data && (data.secure_url || data.url)) return data.secure_url || data.url;
            const text = await uploadRes.text().catch(() => "");
            if (text && text.startsWith("http")) return text;
            throw new Error("Cloudinary fallback upload returned unexpected response.");
          }
        }
      } catch (e) {
        // ignore and surface original error below
      }

      throw new Error(
        "Response body already read (possibly by a browser extension). Disable extensions that inspect network requests and try again."
      );
    }

    throw err;
  }

  if (!signRes.ok) {
    const message = signBody?.json ? JSON.stringify(signBody.json) : signBody?.text || "";
    throw new Error(`Cloudinary signing failed: ${signRes.status} ${message}`);
  }

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

  const { res: signedRes, body: signedBody } = await fetchAndRead(url, {
    method: "POST",
    body: form,
  });

  if (!signedRes.ok) {
    const message = signedBody?.json ? JSON.stringify(signedBody.json) : signedBody?.text || "";
    throw new Error(`Cloudinary signed upload failed: ${signedRes.status} ${message}`);
  }

  if (signedBody.json && (signedBody.json.secure_url || signedBody.json.url)) {
    return signedBody.json.secure_url || signedBody.json.url;
  }
  if (signedBody.text && typeof signedBody.text === "string" && signedBody.text.startsWith("http")) {
    return signedBody.text;
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
