import http from "http";
import fs from "fs";
import chatHandler from "./api/chat.js";
import summaryHandler from "./api/summary.js";

// Read .env file for local development
if (fs.existsSync(".env")) {
  const lines = fs.readFileSync(".env", "utf8").split("\n");

  for (const line of lines) {
    const [key, ...rest] = line.split("=");

    if (key && rest.length && !key.trim().startsWith("#")) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

// Create a small API server for local development
const server = http.createServer((req, res) => {
  if (req.url !== "/api/chat" && req.url !== "/api/summary") {
    res.statusCode = 404;
    return res.end("Not found");
  }

  let body = "";

  req.on("data", (chunk) => (body += chunk));

  req.on("end", () => {
    try {
      req.body = JSON.parse(body || "{}");
    } catch (e) {
      req.body = {};
    }

    if (req.url === "/api/chat") {
      chatHandler(req, res);
    } else {
      summaryHandler(req, res);
    }
  });
});

server.listen(3001, () => {
  console.log("API running on http://localhost:3001");
  console.log("Model:", process.env.GROQ_MODEL || "openai/gpt-oss-120b");
});
