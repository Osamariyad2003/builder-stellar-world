import { RequestHandler } from "express";

export const handleImageKitAuth: RequestHandler = async (_req, res) => {
  try {
    // Try to dynamically import the official ImageKit SDK
    try {
      const ImageKitModule = await import("imagekit");
      const ImageKit = (ImageKitModule && ImageKitModule.default) || ImageKitModule;

      const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || null;
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || null;
      const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || null;

      if (!privateKey) {
        return res.status(500).json({ error: "ImageKit private key not configured on server (IMAGEKIT_PRIVATE_KEY)." });
      }

      const ik = new ImageKit({
        publicKey: publicKey || undefined,
        privateKey: privateKey || undefined,
        urlEndpoint: urlEndpoint || undefined,
      });

      const auth = ik.getAuthenticationParameters();
      return res.json(auth);
    } catch (e) {
      console.error("ImageKit SDK import failed:", e?.message || e);
      return res.status(501).json({
        error: "ImageKit SDK not installed on server. Please install 'imagekit' package (npm i imagekit) to enable client-side uploads with authentication endpoint.",
      });
    }
  } catch (err: any) {
    console.error("/api/imagekit/auth error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
};
