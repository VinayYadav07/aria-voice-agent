// POST /api/chat
// customer ki baat aati hai -> LLM sochta hai -> zarurat ho to tool call -> final reply

import { SYSTEM_PROMPT, tools, runTool } from "./_data.js";
import { callGroq, sendJson } from "./_groq.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Only POST allowed" });
  }
  if (!process.env.GROQ_API_KEY) {
    return sendJson(res, 500, { error: "GROQ_API_KEY is missing on the server" });
  }

  const history = (req.body && req.body.messages) || [];

  // sirf last 20 messages bhejte hai taaki request chhoti rahe
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history.slice(-20)];
  const toolLogs = [];

  try {
    // max 4 round: LLM tool maange to run karke result wapas dete hai
    for (let round = 0; round < 4; round++) {
      const msg = await callGroq({
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1000,
      });

      // tool nahi chahiye -> yahi final jawab hai
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return sendJson(res, 200, { reply: (msg.content || "").trim(), toolLogs });
      }

      messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });

      for (const call of msg.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch (e) {
          args = {};
        }
        const result = runTool(call.function.name, args);
        toolLogs.push({ name: call.function.name, args, result });

        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return sendJson(res, 200, {
      reply: "Sorry, that took longer than expected. Could you please say that again?",
      toolLogs,
    });
  } catch (err) {
    console.log("chat error:", err.message);
    return sendJson(res, 500, { error: err.message });
  }
}
