import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Base config used by both build and dev. Express API plugin is only in vite.config.dev.ts
// so that "vite build" never loads server (and firebase-admin).
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/builder-stellar-world/" : "/",
  server: {
    host: "::",
    port: 5000,
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));
