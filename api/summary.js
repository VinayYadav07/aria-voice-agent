// Handle POST /api/summary
// After the call, create a JSON summary from the transcript

import { callGroq, sendJson } from "./_groq.js";

const SUMMARY_PROMPT = `You review a customer support voice call of Aura Skincare (an Indian skincare brand). 
Return ONLY a JSON object with exactly these keys: 
- "customer_intent": main intent, one of ORDER_TRACKING, ORDER_CANCELLATION, RETURN_REFUND, DAMAGED_PRODUCT, SHIPPING_QUERY, PAYMENT_COD_QUERY, PRODUCT_QUERY, OUT_OF_SCOPE, OTHER 
- "other_intents": array of other intents from the same list (empty array if none) 
- "order_id": the order ID discussed like "ORD-101", or null 
- "resolution_status": one of RESOLVED, UNRESOLVED, POLICY_DECLINED, NEEDS_FOLLOW_UP 
- "customer_sentiment": one of POSITIVE, NEUTRAL, NEGATIVE 
- "actions_taken": array of short strings, for example "Looked up order ORD-101" 
- "call_summary": 1 or 2 plain sentences about what the customer wanted and what happened 
Use only facts from the transcript and tool results. Do not invent anything.`;

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

  const transcript = (req.body && req.body.transcript) || [];
  const toolLogs = (req.body && req.body.toolLogs) || [];

  // Convert transcript and tool results into text
  const callText = transcript
    .map((line) => (line.who === "agent" ? "Aria: " : "Customer: ") + line.text)
    .join("\n");

  const toolText = toolLogs
    .map(
      (t) =>
        t.name +
        "(" +
        JSON.stringify(t.args) +
        ") => " +
        JSON.stringify(t.result),
    )
    .join("\n");

  try {
    const msg = await callGroq({
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        {
          role: "user",
          content:
            "TRANSCRIPT:\n" +
            callText +
            "\n\nTOOL RESULTS:\n" +
            (toolText || "none"),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1000,
    });

    // Sometimes AI adds ``` around JSON, so remove it
    const text = (msg.content || "").replace(/```json|```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const summary = JSON.parse(text.slice(start, end + 1));

    return sendJson(res, 200, { summary });
  } catch (err) {
    // Show error in the server terminal
    console.log("summary error:", err.message);

    return sendJson(res, 500, {
      error: err.message,
    });
  }
}
