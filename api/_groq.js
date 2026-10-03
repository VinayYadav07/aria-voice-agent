// Groq API call karne ka helper (Groq OpenAI jaisa hi API deta hai)

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq(body) {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const request = { model, ...body };

  // gpt-oss model pehle sochta hai, "low" rakha taaki jawab jaldi aaye
  if (model.includes("gpt-oss")) {
    request.reasoning_effort = "low";
  }

  // kabhi kabhi tool call fail ho jaata hai, isliye 2 baar try
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify(request),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices[0].message;
    }

    lastError = "Groq error " + res.status + ": " + (await res.text());
    console.log(lastError);
  }
  throw new Error(lastError);
}

// response bhejne ka simple function (Vercel aur local server dono me chalega)
export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}
