# Aria - AI Voice Support Agent

Aria is a voice customer support agent for Aura Skincare.

You can start a call and talk to Aria using your microphone. Aria can help with orders, delivery, returns, cancellation and COD.

After the call, you can see the conversation and a simple call summary.

## Live Demo

Add your live link here.

## Demo Video

Add your video link here.

## How it works

1. User speaks using the microphone.
2. Browser converts voice into text.
3. The text goes to the backend.
4. Groq AI processes the request.
5. If needed, Aria checks the order using a tool.
6. Aria gives the answer.
7. The answer is spoken back to the user.

## Features

- Voice customer support
- Order details checking
- Order cancellation
- Shipping and return information
- COD information
- Hinglish support
- Tool calling
- Call transcript
- Call summary
- Interrupt Aria while speaking

## Tech Stack

- React
- Vite
- JavaScript
- Web Speech API
- Groq API
- GPT-OSS 120B
- Vercel Serverless Functions

## Approach

I made a React app where the browser listens to the customer and turns the voice into text. The text goes to a small backend (Vercel function) that sends it to Groq AI with the Aura Skincare rules and two tools, `get_order_details` and `cancel_order`. The reply is spoken back in an Indian English voice, and after the call a second AI request makes a JSON summary.

## Run Locally

You need Node.js 20 or above and a free Groq API key from https://console.groq.com/keys

1. Install packages

```bash
npm install
```

2. Make a `.env` file (copy `.env.example`) and add your key

```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

3. Start the app

```bash
npm run dev
```

4. Open http://localhost:3000 in Chrome or Edge and click **Start call**.

The `/api` routes also run inside the Vite dev server, so only one command is needed.

## Deploy on Vercel

1. Push the code to GitHub.
2. Import the repo in Vercel. It detects Vite by itself.
3. Add `GROQ_API_KEY` and `GROQ_MODEL` in Environment Variables.
4. Click Deploy. The `api` folder becomes serverless functions by itself.

## Folder Structure

```
src/
  App.jsx                 main page
  hooks/useVoiceCall.js   all call logic (mic, voice, API calls, summary)
  components/             Orb, Conversation, OrdersPanel, TryPanel, ToolCalls, Summary
api/
  chat.js                 AI reply + tool calling
  summary.js              JSON summary after the call
  _data.js                orders, policies, tools and AI prompt
  _groq.js                helper to call Groq
```

## How Aria uses tools

I send two tools to the AI with a short description. The prompt also says that for any order question it must call `get_order_details` first. So when the customer asks "where is ORD-101", the AI asks for the tool instead of answering. The backend runs the function on the mock order data, sends the result back to the AI, and then the AI gives the final answer. You can see every tool call in the Tool calls panel on the page.

## How the guardrails work

- The prompt has all the Aura Skincare policies and clear rules: don't promise anything outside the policy, don't guess order details, and only talk about Aura Skincare.
- `cancel_order` checks the order status in code. So even if the AI tries, an order that is Out for Delivery can't be cancelled.
- Order details only come from the tool. If the ID is wrong, the tool returns "not found" and Aria asks the customer to check the ID.
- Order IDs said in different ways like "ORD 101" or "one zero one" are changed to `ORD-101` in code.

## Things to Test

| Say this | What should happen |
|---|---|
| "Where is my order ORD-101?" | Out for Delivery, BlueDart, by 6 PM today |
| "I want to cancel ORD-103" | Aria asks to confirm, then cancels |
| "Cancel ORD-101" | Not possible, customer can refuse at doorstep |
| "I opened ORD-102, can I return it?" | Outside return policy |
| "Check ORD-999" | Order not found, asks to check the ID |
| "COD for 3000 rupees?" | No, COD is only up to 2,500 rupees |
| "Book me a flight to Goa" | Can only help with Aura Skincare |
| "Mera order kab aayega, ORD-101" | Reply in Hinglish |

## Known Limits

- Works only in Chrome and Edge. Firefox and Safari don't support voice input well.
- The voice depends on the voices on your computer. Edge on Windows has better Indian voices.
- If you pause for a long time while speaking, the mic stops listening.
- Cancel is only a mock. It does not save anything.
- To interrupt Aria you click the circle. Real voice interruption needs echo cancellation.

## My Answers

### 1. Why did you choose this architecture and tech stack?

I wanted something that runs in the browser, is free and has low delay. The browser already has speech to text and text to speech, so I didn't need to send audio to a server. Groq is very fast and supports tool calling, and the free plan was enough. I used React with Vite because I work with React, the UI is split into small components and all the call logic is in one custom hook. For the backend I used Vercel functions because they deploy with the same repo and the API key stays on the server.

### 2. What was the most difficult part and how did you solve it?

The hardest part was the call flow: listening, then thinking, then speaking, then listening again, without getting stuck or the mic hearing Aria. I made three clear states and the mic only listens when Aria is not speaking. In React the async functions were getting old state values, so I used `useRef` for things like call status and chat history. Chrome also stopped long speech in the middle, so I speak the reply sentence by sentence with a backup timer. Groq also shut down the first model I used (Llama 3.3 70B), so I moved to GPT-OSS 120B. The model name is in `.env`, so I only changed one line.

### 3. If you had one more week, what would you improve first and why?

I would improve the voice quality and speed first, because that is what the customer feels the most. I would use streaming speech to text (like Deepgram) and a better Indian voice (like ElevenLabs or Sarvam), and stream the AI reply so Aria starts talking faster. This would also allow real interruption, where the customer can just talk over Aria. After that I would add customer verification before sharing order details.

### 4. If this agent handles 1,000 conversations a day, what would need to change?

- Use a real order database and save every call (transcript, summary, tool calls).
- Verify the customer (like phone number) before sharing order details.
- Hand over to a human agent when the customer is angry or the bot can't solve the problem.
- Rate limits, retries and a backup AI provider so the service doesn't stop if one API is down. A paid plan, because free plans have limits.
- A dashboard to see how many calls were solved, average reply time and common questions.
- Test conversations that run every time the prompt changes, to check the rules still work.
- Keep cost low with shorter prompts and maybe a smaller model for easy questions.
- Maybe add phone calls, because many customers in India prefer calling.

## Author

Vinay Kumar Yadav

- LinkedIn: https://www.linkedin.com/in/vinay-kumar-yadav-593b53329
- GitHub: https://github.com/VinayYadav07
