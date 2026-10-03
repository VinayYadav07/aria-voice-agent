// Handle POST /api/chat
// User message -> AI -> tool if needed -> final reply

import { SYSTEM_PROMPT, tools, runTool } from "./_data.js";
import { callGroq, sendJson } from "./_groq.js";

// Make the reply easy to speak (remove markdown, say rupees)
function cleanReply(text) {
  return (text || "")
    .replace(/₹\s?([\d,]+)/g, "$1 rupees")
    .replace(/[*#`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Chat API handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Only POST allowed" });
  }

  // Check Groq API key
  if (!process.env.GROQ_API_KEY) {
    return sendJson(res, 500, {
      error: "GROQ_API_KEY is missing on the server",
    });
  }

  const history = (req.body && req.body.messages) || [];

  // Keep the last 20 messages
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-20),
  ];

  const toolLogs = [];

  try {
    // Allow up to 4 AI and tool rounds
    for (let round = 0; round < 4; round++) {
      const msg = await callGroq({
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1000,
      });

      // Return final answer when no tool is needed
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return sendJson(res, 200, {
          reply: cleanReply(msg.content),
          toolLogs,
        });
      }

      messages.push({
        role: "assistant",
        content: msg.content || "",
        tool_calls: msg.tool_calls,
      });

      // Run the tools requested by AI
      for (const call of msg.tool_calls) {
        let args = {};

        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch (e) {
          args = {};
        }

        const result = runTool(call.function.name, args);

        toolLogs.push({
          name: call.function.name,
          args,
          result,
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    return sendJson(res, 200, {
      reply:
        "Sorry, that took longer than expected. Could you please say that again?",
      toolLogs,
    });
  } catch (err) {
    // Show error in the server terminal
    console.log("chat error:", err.message);

    return sendJson(res, 500, {
      error: err.message,
    });
  }
}
