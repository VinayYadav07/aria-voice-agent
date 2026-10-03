import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import chatHandler from "./api/chat.js";
import summaryHandler from "./api/summary.js";

// local pe /api wali request yahi handle kar lo (alag server ki zarurat nahi)
// Vercel pe /api folder khud chalta hai, wahan ye use nahi hota
function apiPlugin() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/api/chat" && req.url !== "/api/summary") return next();

        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            req.body = JSON.parse(body || "{}");
          } catch (e) {
            req.body = {};
          }
          if (req.url === "/api/chat") chatHandler(req, res);
          else summaryHandler(req, res);
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env se key le lo
  const env = loadEnv(mode, process.cwd(), "");
  process.env.GROQ_API_KEY = env.GROQ_API_KEY;
  if (env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL;

  return {
    plugins: [react(), apiPlugin()],
    server: { port: 3000 },
  };
});
