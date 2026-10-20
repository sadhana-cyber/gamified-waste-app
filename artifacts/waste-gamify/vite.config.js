import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";
const apiTarget = process.env.API_TARGET || "http://localhost:8080";
var stdin_default = defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false })
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets")
    },
    dedupe: ["react", "react-dom"]
  },
  envDir: path.resolve(import.meta.dirname, "../.."),
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    port,
    strictPort: false,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true
      }
    },
    fs: {
      strict: true
    }
  },
  preview: {
    port,
    host: "0.0.0.0"
  }
});
export {
  stdin_default as default
};
