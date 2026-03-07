import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/ws": {
        target: "ws://localhost:7000/",
        // target: "ws://localhost:8004/",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ""),
        ws: true,
      },
      "/api/": {
        target: "ws://localhost:7000/",
        changeOrigin: true,
      },
    },
  },
});
