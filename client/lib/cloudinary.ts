export async function uploadImageToCloudinary(file: File): Promise<string> {
  let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // If build-time cloudName is missing (deployed without VITE_*), request runtime config from server
  if (!cloudName) {
    try {
      const cfgRes = await fetch('/api/cloudinary/config');
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
    throw new Error(
      "Cloudinary cloud name is not configured. Set VITE_CLOUDINARY_CLOUD_NAME in your environment or provide server config."
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

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
      const text = await res.text();
      throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.secure_url || data.url;
  }

  // Otherwise, request a signed signature from the application server
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!signRes.ok) {
    const text = await signRes.text();
    throw new Error(`Cloudinary signing failed: ${signRes.status} ${text}`);
  }

  const signData = await signRes.json();
  const { signature, apiKey, timestamp } = signData;

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
    const text = await res.text();
    throw new Error(`Cloudinary signed upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.secure_url || data.url;
}
