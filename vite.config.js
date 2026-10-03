import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// local pe /api wali request ko node server (port 3001) pe bhej do
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
