import { defineConfig } from "vite";
import type { Plugin } from "vite";
import baseConfig from "./vite.config";
import { createServer } from "./server";

// Dev-only config: mounts Express API at /api. Use with: vite --config vite.config.dev.ts
// This file imports ./server (and thus firebase-admin) only when running dev, not during "vite build".
export default defineConfig((env) => {
  const base = typeof baseConfig === "function" ? baseConfig(env) : baseConfig;
  return {
    ...base,
    plugins: [...base.plugins, expressPlugin()],
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use("/api", app);
    },
  };
}
