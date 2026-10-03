// Text shown for each status
const labels = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

// Default hint for each status
const defaultHints = {
  idle: "Click Start call and allow microphone access.",
  listening: "Go ahead, Aria is listening.",
  thinking: "Aria is working on your answer.",
  speaking: "Click the circle to interrupt.",
};

// Orb component
function Orb({ status, hint, onClick }) {
  return (
    <>
      <button
        className={"orb " + status}
        onClick={onClick}
        aria-label="Agent status"
        title="Click while Aria is speaking to interrupt her"
      >
        <span className="orb-core"></span>
      </button>

      <p className="state-label">{labels[status]}</p>
      <p className="state-hint">{hint || defaultHints[status]}</p>
    </>
  );
}

export default Orb;
