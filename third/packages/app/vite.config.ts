import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { devFileSystemPlugin } from "./vite-plugins/dev-fs.js";

export default defineConfig({
  plugins: [react(), devFileSystemPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    strictPort: false,
    host: true,
  },
  optimizeDeps: {
    include: ["typescript"],
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  worker: {
    format: "es",
  },
});
