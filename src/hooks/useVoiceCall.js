import { useEffect, useRef, useState } from "react";

// Main call logic
// Flow: Listening -> Thinking -> Speaking -> Listening

const GREETING =
  "Hi, this is Aria from Aura Skincare. How can I help you today?";

const NOT_HEARD =
  "Sorry, I couldn't hear you clearly. Could you please say that again?";

const TECH_ISSUE =
  "Sorry, I'm facing a small technical issue. Could you please say that again?";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const isSupported = !!(SpeechRecognition && window.speechSynthesis);

function timeNow() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function useVoiceCall() {
  // State used to show data on the screen
  const [status, setStatus] = useState("idle");
  const [hint, setHint] = useState("");
  const [liveText, setLiveText] = useState("");
  const [lines, setLines] = useState([]);
  const [toolLogs, setToolLogs] = useState([]);
  const [error, setError] = useState("");
  const [inCall, setInCall] = useState(false);
  const [summary, setSummary] = useState(null);

  // Refs keep the latest values inside async functions
  const activeRef = useRef(false);
  const statusRef = useRef("idle");
  const messagesRef = useRef([]);
  const linesRef = useRef([]);
  const toolsRef = useRef([]);
  const recognitionRef = useRef(null);
  const voiceRef = useRef(null);
  const interruptedRef = useRef(false);
  const silenceRef = useRef(0);
  const startTimeRef = useRef(0);

  // Find an Indian English voice
  useEffect(() => {
    if (!isSupported) return;

    function loadVoice() {
      const voices = window.speechSynthesis.getVoices();
      const lang = (v) => v.lang.replace("_", "-");

      voiceRef.current =
        voices.find(
          (v) =>
            lang(v) === "en-IN" && /female|heera|neerja|google/i.test(v.name),
        ) ||
        voices.find((v) => lang(v) === "en-IN") ||
        voices.find((v) => lang(v) === "hi-IN") ||
        voices.find((v) => lang(v).startsWith("en")) ||
        null;
    }

    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;

    // Stop voice when the page is closed
    return () => window.speechSynthesis.cancel();
  }, []);

  function changeStatus(newStatus, newHint = "") {
    statusRef.current = newStatus;
    setStatus(newStatus);
    setHint(newHint);
  }

  function addLine(who, text) {
    const line = {
      who,
      text,
      time: timeNow(),
    };

    linesRef.current = [...linesRef.current, line];
    setLines(linesRef.current);
  }

  function addToolLogs(logs) {
    toolsRef.current = [...toolsRef.current, ...logs];
    setToolLogs(toolsRef.current);
  }

  // Speak one sentence
  function speakPart(text) {
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);

      if (voiceRef.current) {
        utter.voice = voiceRef.current;
        utter.lang = voiceRef.current.lang;
      } else {
        utter.lang = "en-IN";
      }

      utter.rate = 1.05;

      // Backup timer in case onend does not work
      const backup = setTimeout(resolve, text.length * 90 + 4000);

      utter.onend = () => {
        clearTimeout(backup);
        resolve();
      };

      utter.onerror = () => {
        clearTimeout(backup);
        resolve();
      };

      window.speechSynthesis.speak(utter);
    });
  }

  // Speak the complete reply
  async function speak(text, newHint = "") {
    interruptedRef.current = false;
    changeStatus("speaking", newHint);

    // Clear any old speech that is stuck
    window.speechSynthesis.cancel();

    const parts = text.match(/[^.!?]+[.!?]*/g) || [text];

    for (const part of parts) {
      if (interruptedRef.current || !activeRef.current) {
        break;
      }

      await speakPart(part.trim());
    }
  }

  // Stop Aria while she is speaking
  function interrupt() {
    if (activeRef.current && statusRef.current === "speaking") {
      interruptedRef.current = true;
      window.speechSynthesis.cancel();
    }
  }

  // Listen to the user through the microphone
  function listen() {
    if (!activeRef.current) return;

    changeStatus("listening");

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognitionRef.current = recognition;

    let finalText = "";
    let silenceTimer = null;

    // If user says nothing for 10 seconds, stop listening
    let noSpeechTimer = setTimeout(() => recognition.stop(), 10000);

    // Stop listening when user is quiet for a moment
    function waitForSilence() {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => recognition.stop(), 1300);
    }

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setLiveText(finalText + interim);

      clearTimeout(noSpeechTimer);
      waitForSilence();
    };

    recognition.onerror = (event) => {
      console.log("mic error:", event.error);

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setError(
          "Microphone access is blocked. Please allow the mic in your browser and start the call again.",
        );

        endCall();
      }

      if (event.error === "network") {
        setError("Voice input needs internet. Please check your connection.");
      }
    };

    // When the user stops speaking, handle the text
    recognition.onend = () => {
      clearTimeout(silenceTimer);
      clearTimeout(noSpeechTimer);
      setLiveText("");
      handleUserSpeech(finalText.trim());
    };

    try {
      recognition.start();
    } catch (e) {
      console.log("recognition start error", e);
    }
  }

  async function handleUserSpeech(text) {
    if (!activeRef.current) return;

    // Handle empty speech
    if (!text) {
      silenceRef.current++;

      if (silenceRef.current >= 2) {
        silenceRef.current = 0;

        addLine("agent", NOT_HEARD);

        await speak(NOT_HEARD);
      }

      listen();
      return;
    }

    silenceRef.current = 0;

    await askAria(text);
  }

  // Send user message to the server
  async function askAria(text) {
    addLine("customer", text);

    messagesRef.current = [
      ...messagesRef.current,
      {
        role: "user",
        content: text,
      },
    ];

    changeStatus("thinking");

    let reply = "";
    const startTime = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesRef.current,
        }),
      });

      // Read response as text first
      const responseText = await res.text();

      let data = {};

      // Convert response text into JSON
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error("Server returned an invalid response.");
      }

      // Handle server errors
      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      reply = data.reply || NOT_HEARD;
      setError("");

      if (data.toolLogs && data.toolLogs.length) {
        addToolLogs(data.toolLogs);
      }
    } catch (err) {
      console.log("chat failed:", err);

      setError("Could not reach the server: " + err.message);

      reply = TECH_ISSUE;
    }

    if (!activeRef.current) return;

    const seconds = ((Date.now() - startTime) / 1000).toFixed(1);

    messagesRef.current = [
      ...messagesRef.current,
      {
        role: "assistant",
        content: reply,
      },
    ];

    addLine("agent", reply);

    await speak(
      reply,
      "Replied in " + seconds + "s. Click the circle to interrupt.",
    );

    listen();
  }

  // Start the call
  async function startCall() {
    setError("");

    // Ask for microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      setError(
        "Microphone access is needed for the call. Please allow it and try again.",
      );

      return;
    }

    // Reset call data
    activeRef.current = true;
    messagesRef.current = [
      {
        role: "assistant",
        content: GREETING,
      },
    ];

    linesRef.current = [];
    toolsRef.current = [];
    silenceRef.current = 0;
    startTimeRef.current = Date.now();

    setLines([]);
    setToolLogs([]);
    setSummary(null);
    setInCall(true);

    addLine("agent", GREETING);

    await speak(GREETING);

    listen();
  }

  // End the call
  function endCall() {
    if (!activeRef.current) return;

    activeRef.current = false;

    const callSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    window.speechSynthesis.cancel();

    changeStatus("idle", "Call ended.");
    setLiveText("");
    setInCall(false);

    makeSummary(callSeconds);
  }

  // Create summary after the call
  async function makeSummary(callSeconds) {
    const transcript = linesRef.current;
    const tools = toolsRef.current;

    const customerSpoke = transcript.some((line) => line.who === "customer");

    if (!customerSpoke) {
      setSummary({
        error:
          "The customer did not say anything, so there is nothing to summarise.",
      });

      return;
    }

    setSummary({
      loading: true,
    });

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          toolLogs: tools,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      // Add call duration and other details
      setSummary({
        data: {
          ...data.summary,
          call_duration_seconds: callSeconds,
          customer_turns: transcript.filter((l) => l.who === "customer").length,
          tools_used: tools.map((t) => t.name),
        },
      });
    } catch (err) {
      setSummary({
        error: "Could not create the summary: " + err.message,
      });
    }
  }

  return {
    isSupported,
    status,
    hint,
    liveText,
    lines,
    toolLogs,
    error,
    inCall,
    summary,
    startCall,
    endCall,
    interrupt,
  };
}
