import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSign } from "./routes/cloudinary";
import { handleConfig } from "./routes/cloudinaryConfig";
import { handleUpload } from "./routes/cloudinaryUpload";
import { handleImageKitUpload } from "./routes/imagekitUpload";
import { handleImageKitAuth } from "./routes/imagekitAuth";
import { handleSaveFCMToken, handleSendBatchNotification, handleSendUserNotification } from "./routes/notifications";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  // Increase payload limit to accept large data URLs / uploads from client
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Example API routes
  app.get("/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/demo", handleDemo);

  // Cloudinary signing endpoint
  app.post("/cloudinary/sign", handleSign);

  // Server-side upload endpoint (accepts data URL and uploads to Cloudinary)
  app.post("/cloudinary/upload", handleUpload);
  // Server-side ImageKit upload endpoint
  app.post("/imagekit/upload", handleImageKitUpload);
  // ImageKit auth endpoint for client-side direct uploads
  app.get("/imagekit/auth", handleImageKitAuth);

  // Provide Cloudinary config (runtime) to clients when VITE_* not available
  app.get("/cloudinary/config", handleConfig);

  // FCM notification endpoints
  app.post("/save-fcm-token", handleSaveFCMToken);
  app.post("/send-batch-notification", handleSendBatchNotification);
  app.post("/send-user-notification", handleSendUserNotification);

  // Log registered API routes for debugging
  try {
    const routes: string[] = [];
    (app as any)._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        const path = middleware.route.path;
        const methods = Object.keys(middleware.route.methods).join(",").toUpperCase();
        routes.push(`${methods} /api${path}`);
      } else if (middleware.name === "router" && middleware.handle && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            const path = handler.route.path;
            const methods = Object.keys(handler.route.methods).join(",").toUpperCase();
            routes.push(`${methods} /api${path}`);
          }
        });
      }
    });
    console.log("Registered API routes:", routes);
  } catch (e) {
    // ignore route listing failures
  }

  return app;
}
