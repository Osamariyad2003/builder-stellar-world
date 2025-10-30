export async function uploadImageToCloudinary(file: File): Promise<string> {
  let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Allow an explicit API base for deployments where the frontend is hosted separately (e.g. GitHub Pages)
  const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

  // Fetch runtime server config if available (helps pick up CLOUDINARY_UPLOAD_PRESET even when VITE vars are not present)
  try {
    const cfgRes = await fetch(`${API_BASE}/api/cloudinary/config`);
    if (cfgRes.ok) {
      try {
        const cfg = await cfgRes.json();
        cloudName = cfg.cloudName || cloudName;
        uploadPreset = cfg.uploadPreset || cfg.upload_preset || uploadPreset;
      } catch {
        // if body can't be read, try headers
        const headerCloud = cfgRes.headers.get("x-cloudinary-cloudname");
        const headerPreset = cfgRes.headers.get("x-cloudinary-upload-preset");
        if (headerCloud) cloudName = cloudName || headerCloud;
        if (headerPreset) uploadPreset = uploadPreset || headerPreset;
      }
    }
  } catch (e) {
    // ignore
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

  // Force server-side upload first to avoid browser extension fetch interception
  try {
    const serverResult = await uploadToServer(file);
    if (serverResult && typeof serverResult === "string" && serverResult.startsWith("http")) {
      return serverResult;
    }
  } catch (err: any) {
    // If server endpoint is not configured or fails, fall back to client flows.
    // But surface helpful message for common cases.
    const msg = String(err?.message || err || "");
    console.warn("Server upload failed, falling back to client upload:", msg);
    // continue to client-side flows
  }

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
    const attemptFetch = async (urlStr: string, initObj?: RequestInit) => {
      const res = await fetch(urlStr, initObj as any);
      const bodyResult = await readResponseBody(res).catch((err) => {
        throw err;
      });
      return { res, body: bodyResult } as const;
    };

    const asUrl = typeof input === "string" ? input : (input as Request).url;

    // First try using window.fetch (normal path)
    try {
      return await attemptFetch(asUrl, init);
    } catch (err: any) {
      const msg = String(err?.message || err || "").toLowerCase();

      // If body already read, try cache-bypass retry via fetch
      if (msg.includes("response body already read") || msg.includes("body already read")) {
        const retryUrl = asUrl + (asUrl.includes("?") ? `&_retry=${Date.now()}` : `?_retry=${Date.now()}`);
        try {
          return await attemptFetch(retryUrl, init);
        } catch (_) {
          // fallthrough to XHR fallback below
        }
      }

      // If 'Failed to fetch' or network error (often caused by extension patching fetch), or body-used issues, try XHR fallback
      if (
        msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("network request failed") ||
        msg.includes("script error") ||
        msg.includes("response body already read") ||
        msg.includes("body already read")
      ) {
        try {
          // Perform XHR manually to avoid extension-patched fetch or body-consumed responses
          return await (async () => {
            return await new Promise<any>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              let method = (init && init.method) || "GET";
              let isForm = false;
              try {
                xhr.open(method, asUrl, true);
                // set headers
                if (init && init.headers) {
                  const headers = init.headers as any;
                  Object.keys(headers).forEach((h) => {
                    try { xhr.setRequestHeader(h, headers[h]); } catch (_) {}
                  });
                }

                xhr.onreadystatechange = () => {
                  if (xhr.readyState !== 4) return;
                  const status = xhr.status || 0;
                  const headersObj: Record<string, string> = {};
                  const raw = xhr.getAllResponseHeaders() || "";
                  raw.split("\r\n").forEach((line) => {
                    const idx = line.indexOf(":");
                    if (idx > 0) {
                      const key = line.substring(0, idx).trim().toLowerCase();
                      const val = line.substring(idx + 1).trim();
                      headersObj[key] = val;
                    }
                  });

                  const resLike = {
                    ok: status >= 200 && status < 400,
                    status,
                    headers: { get: (k: string) => headersObj[k.toLowerCase()] || null },
                  } as any;

                  const text = xhr.responseText;
                  let json = null;
                  try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

                  const bodyResult = { json, text } as const;
                  resolve({ res: resLike, body: bodyResult });
                };

                xhr.onerror = () => reject(new Error("XHR network error"));
                xhr.ontimeout = () => reject(new Error("XHR timeout"));

                // send body
                if (init && init.body) {
                  // If body is FormData, send directly
                  try {
                    if ((init.body as any) instanceof FormData) {
                      isForm = true;
                      xhr.send(init.body as any);
                    } else if (typeof init.body === "string") {
                      xhr.send(init.body as any);
                    } else {
                      try { xhr.send(JSON.stringify(init.body)); } catch (e) { xhr.send(String(init.body)); }
                    }
                  } catch (e) {
                    reject(e);
                  }
                } else {
                  xhr.send();
                }
              } catch (e) {
                reject(e);
              }
            });
          })();
        } catch (xhrErr) {
          // fall through to throw original
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
  // include public apiKey from client env/localStorage when available
  const clientApiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || (() => {
    try { return localStorage.getItem("cloudinary.apiKey"); } catch { return null; }
  })() || null;

  let signRes, signBody;
  try {
    const out = await fetchAndRead(`${API_BASE}/api/cloudinary/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: clientApiKey }),
    });
    signRes = out.res;
    signBody = out.body;
  } catch (err: any) {
    const msg = String(err?.message || err || "");
    // If the response body was already read (often by extensions), try to read signing values from headers
    if (msg.toLowerCase().includes("response body already read") || msg.toLowerCase().includes("body already read")) {
      try {
        const headerRes = await fetch(`${API_BASE}/api/cloudinary/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: clientApiKey }),
        });

        // Read signature/timestamp/apikey/cloudname from headers
        const headerSignature = headerRes.headers.get("x-cloudinary-signature");
        const headerTimestamp = headerRes.headers.get("x-cloudinary-timestamp");
        const headerApiKey = headerRes.headers.get("x-cloudinary-apikey");
        const headerCloudName = headerRes.headers.get("x-cloudinary-cloudname");
        const headerPreset = headerRes.headers.get("x-cloudinary-upload-preset");

        if (headerSignature && headerTimestamp) {
          const effectiveApiKey = headerApiKey || clientApiKey || null;
          const signature = headerSignature;
          const timestamp = Number(headerTimestamp);

          // If server returned cloudName, prefer it
          if (headerCloudName) cloudName = cloudName || headerCloudName;

          const form = new FormData();
          form.append("file", file);
          if (effectiveApiKey) form.append("api_key", effectiveApiKey);
          form.append("timestamp", String(timestamp));
          form.append("signature", signature);

          const { res: signedRes, body: signedBody } = await fetchAndRead(url, {
            method: "POST",
            body: form,
          });

          if (!signedRes.ok) {
            const message = signedBody?.json ? JSON.stringify(signedBody.json) : signedBody?.text || "";

            const lower = (message || "").toLowerCase();
            if (lower.includes("missing required parameter - api_key") || lower.includes("missing required parameter - api key") || lower.includes("missing required parameter 'api_key'")) {
              const fallbackClientKey = clientApiKey || (() => {
                try { return localStorage.getItem("cloudinary.apiKey"); } catch { return null; }
              })();

              if (fallbackClientKey) {
                const retryForm = new FormData();
                retryForm.append("file", file);
                retryForm.append("api_key", fallbackClientKey);
                retryForm.append("timestamp", String(timestamp));
                retryForm.append("signature", signature);

                const { res: retryRes, body: retryBody } = await fetchAndRead(url, { method: "POST", body: retryForm });
                if (!retryRes.ok) {
                  const msg2 = retryBody?.json ? JSON.stringify(retryBody.json) : retryBody?.text || "";
                  throw new Error(`Cloudinary signed upload retry failed: ${retryRes.status} ${msg2}`);
                }
                if (retryBody.json && (retryBody.json.secure_url || retryBody.json.url)) return retryBody.json.secure_url || retryBody.json.url;
                if (retryBody.text && typeof retryBody.text === "string" && retryBody.text.startsWith("http")) return retryBody.text;
                throw new Error("Cloudinary signed upload retry returned unexpected response.");
              }

              if (uploadPreset) {
                const formF = new FormData();
                formF.append("file", file);
                formF.append("upload_preset", uploadPreset);
                const upRes = await fetch(url, { method: "POST", body: formF });
                if (!upRes.ok) {
                  const txt = await upRes.text().catch(() => "");
                  throw new Error(`Cloudinary unsigned fallback failed: ${upRes.status} ${txt}`);
                }
                const data = await upRes.json().catch(() => null);
                if (data && (data.secure_url || data.url)) return data.secure_url || data.url;
                const txt = await upRes.text().catch(() => "");
                if (txt && txt.startsWith("http")) return txt;
                throw new Error("Cloudinary unsigned fallback returned unexpected response.");
              }
            }

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

        // If headers didn't include signature, try unsigned fallback preset from header
        if (headerPreset) {
          const form = new FormData();
          form.append("file", file);
          form.append("upload_preset", headerPreset);

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
      } catch (e) {
        // ignore and surface original error below
      }

      // Try server-side upload fallback before giving up (avoids browser extensions that consume response bodies)
      try {
        const serverUrl = await uploadToServer(file);
        if (serverUrl && typeof serverUrl === "string" && serverUrl.startsWith("http")) {
          return serverUrl;
        }
      } catch (e) {
        // ignore and fall through to original error
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
  const { signature, apiKey: signApiKey, timestamp } = signData as any;
  const effectiveApiKey = signApiKey || clientApiKey || null;

  if (!signature || !timestamp) {
    throw new Error("Cloudinary signing endpoint returned invalid data.");
  }

  // If signing didn't provide an api_key and client doesn't have one, prefer unsigned preset if configured,
  // otherwise attempt server-side upload fallback, and finally surface a clear error.
  if (!effectiveApiKey) {
    if (uploadPreset) {
      const formF = new FormData();
      formF.append("file", file);
      formF.append("upload_preset", uploadPreset);
      const { res: upRes, body: upBody } = await fetchAndRead(url, { method: "POST", body: formF });
      if (!upRes.ok) {
        const msg = upBody?.json ? JSON.stringify(upBody.json) : upBody?.text || "";
        throw new Error(`Cloudinary unsigned upload (preset) failed: ${upRes.status} ${msg}`);
      }
      if (upBody.json && (upBody.json.secure_url || upBody.json.url)) return upBody.json.secure_url || upBody.json.url;
      if (upBody.text && typeof upBody.text === "string" && upBody.text.startsWith("http")) return upBody.text;
      throw new Error("Cloudinary unsigned upload (preset) returned unexpected response.");
    }

    // Try server-side upload fallback (may fail if server not configured) before giving a user-facing error
    try {
      const serverUrl = await uploadToServer(file);
      if (serverUrl && typeof serverUrl === "string" && serverUrl.startsWith("http")) return serverUrl;
    } catch (e) {
      // ignore - will throw clearer error below
    }

    throw new Error(
      "Cloudinary signing did not return an API key and no unsigned preset is configured. Set CLOUDINARY_API_KEY on the server, or set CLOUDINARY_UPLOAD_PRESET, or set a public API key in localStorage (for testing)."
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", effectiveApiKey as any);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const { res: signedRes, body: signedBody } = await fetchAndRead(url, {
    method: "POST",
    body: form,
  });

  if (!signedRes.ok) {
    const message = signedBody?.json ? JSON.stringify(signedBody.json) : signedBody?.text || "";

    const lower = (message || "").toLowerCase();
    if (lower.includes("missing required parameter - api_key") || lower.includes("missing required parameter - api key") || lower.includes("missing required parameter 'api_key'")) {
      const fallbackClientKey = clientApiKey || (() => {
        try { return localStorage.getItem("cloudinary.apiKey"); } catch { return null; }
      })();

      if (fallbackClientKey) {
        const retryForm = new FormData();
        retryForm.append("file", file);
        retryForm.append("api_key", fallbackClientKey);
        retryForm.append("timestamp", String(timestamp));
        retryForm.append("signature", signature);

        const { res: retryRes, body: retryBody } = await fetchAndRead(url, { method: "POST", body: retryForm });
        if (!retryRes.ok) {
          const msg2 = retryBody?.json ? JSON.stringify(retryBody.json) : retryBody?.text || "";
          throw new Error(`Cloudinary signed upload retry failed: ${retryRes.status} ${msg2}`);
        }
        if (retryBody.json && (retryBody.json.secure_url || retryBody.json.url)) return retryBody.json.secure_url || retryBody.json.url;
        if (retryBody.text && typeof retryBody.text === "string" && retryBody.text.startsWith("http")) return retryBody.text;
        throw new Error("Cloudinary signed upload retry returned unexpected response.");
      }

      if (uploadPreset) {
        const formF = new FormData();
        formF.append("file", file);
        formF.append("upload_preset", uploadPreset);
        const upRes = await fetch(url, { method: "POST", body: formF });
        if (!upRes.ok) {
          const txt = await upRes.text().catch(() => "");
          throw new Error(`Cloudinary unsigned fallback failed: ${upRes.status} ${txt}`);
        }
        const data = await upRes.json().catch(() => null);
        if (data && (data.secure_url || data.url)) return data.secure_url || data.url;
        const txt = await upRes.text().catch(() => "");
        if (txt && txt.startsWith("http")) return txt;
        throw new Error("Cloudinary unsigned fallback returned unexpected response.");
      }
    }

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

// Upload file to server which will forward to Cloudinary
async function uploadToServer(file: File): Promise<string> {
  // read file as data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Failed to read file"));
    fr.readAsDataURL(file);
  });

  return await new Promise<string>((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/cloudinary/upload`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;
        const status = xhr.status || 0;
        const text = xhr.responseText || "";
        if (status < 200 || status >= 400) {
          let msg = text;
          try { const j = text ? JSON.parse(text) : null; if (j && j.error) msg = j.error; } catch {}
          return reject(new Error(`Server upload failed: ${status} ${msg}`));
        }
        try {
          const json = text ? JSON.parse(text) : {};
          if (json && (json.secure_url || json.url)) return resolve(json.secure_url || json.url);
          return reject(new Error("Server upload returned unexpected response"));
        } catch (e) {
          return reject(new Error("Server upload returned non-JSON response"));
        }
      };
      xhr.onerror = () => reject(new Error("Server upload XHR error"));
      xhr.send(JSON.stringify({ file: dataUrl, filename: file.name }));
    } catch (e) {
      reject(e);
    }
  }).catch(async (err) => {
    // If server-side Cloudinary upload failed due to missing Cloudinary config, try ImageKit server fallback
    try {
      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("cloudinary not configured") || msg.includes("404") || msg.includes("server upload failed")) {
        // call imagekit endpoint via XHR as well
        return await new Promise<string>((resolve, reject) => {
          try {
            const xhr2 = new XMLHttpRequest();
            xhr2.open("POST", `${API_BASE}/api/imagekit/upload`, true);
            xhr2.setRequestHeader("Content-Type", "application/json");
            xhr2.onreadystatechange = () => {
              if (xhr2.readyState !== 4) return;
              const status2 = xhr2.status || 0;
              const text2 = xhr2.responseText || "";
              if (status2 < 200 || status2 >= 400) {
                let msg2 = text2;
                try { const j = text2 ? JSON.parse(text2) : null; if (j && j.error) msg2 = j.error; } catch {}
                return reject(new Error(`ImageKit server upload failed: ${status2} ${msg2}`));
              }
              try {
                const json2 = text2 ? JSON.parse(text2) : {};
                if (json2 && (json2.url || json2.filePath)) return resolve(json2.url || json2.filePath);
                return reject(new Error("ImageKit server upload returned unexpected response"));
              } catch (e) {
                return reject(new Error("ImageKit server upload returned non-JSON response"));
              }
            };
            xhr2.onerror = () => reject(new Error("ImageKit server upload XHR error"));
            xhr2.send(JSON.stringify({ file: dataUrl, filename: file.name }));
          } catch (e2) {
            reject(e2);
          }
        });
      }
    } catch (e) {
      // ignore fallback errors
    }
    throw err;
  });
}

export function setLocalCloudinaryConfig(cloudName: string | null, uploadPreset?: string | null, apiKey?: string | null) {
  try {
    if (cloudName) localStorage.setItem("cloudinary.cloudName", cloudName);
    if (uploadPreset) localStorage.setItem("cloudinary.uploadPreset", uploadPreset);
    if (apiKey) localStorage.setItem("cloudinary.apiKey", apiKey);
  } catch (e) {
    console.warn("Could not persist Cloudinary config to localStorage", e);
  }
}

export async function uploadUrlToServer(urlString: string, filename?: string): Promise<string> {
  if (!urlString) throw new Error("No URL provided");

  return await new Promise<string>((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/cloudinary/upload`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;
        const status = xhr.status || 0;
        const text = xhr.responseText || "";
        if (status < 200 || status >= 400) {
          let msg = text;
          try { const j = text ? JSON.parse(text) : null; if (j && j.error) msg = j.error; } catch {}
          return reject(new Error(`Server upload failed: ${status} ${msg}`));
        }
        try {
          const json = text ? JSON.parse(text) : {};
          if (json && (json.secure_url || json.url)) return resolve(json.secure_url || json.url);
          return reject(new Error("Server upload returned unexpected response"));
        } catch (e) {
          return reject(new Error("Server upload returned non-JSON response"));
        }
      };
      xhr.onerror = () => reject(new Error("Server upload XHR error"));
      xhr.send(JSON.stringify({ file: urlString, filename: filename || "remote" }));
    } catch (e) {
      reject(new Error("Failed to call server upload endpoint: " + String(e)));
    }
  });
}
