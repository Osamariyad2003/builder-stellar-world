import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSign } from "./routes/cloudinary";
import { handleConfig } from "./routes/cloudinaryConfig";
import { handleUpload } from "./routes/cloudinaryUpload";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Cloudinary signing endpoint
  app.post("/api/cloudinary/sign", handleSign);

  // Provide Cloudinary config (runtime) to clients when VITE_* not available
  app.get("/api/cloudinary/config", handleConfig);

  return app;
}
