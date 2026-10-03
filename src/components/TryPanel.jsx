// Sample questions for testing
const tries = [
  "Where is my order ORD-101?",
  "I want to cancel ORD-103.",
  "I bought ORD-102 and opened it. Can I return it?",
  "Check order ORD-999.",
  "Is cash on delivery available for 3000 rupees?",
  "Can you book me a flight to Goa?",
  "Mera order kab aayega? ORD-101.",
];

// Try panel component
function TryPanel() {
  return (
    <div className="box">
      <h2>Things to try</h2>

      <ul className="tries">
        {tries.map((text) => (
          <li key={text}>"{text}"</li>
        ))}
      </ul>

      <p className="tip">
        Tip: click the circle while Aria is talking to interrupt her.
      </p>
    </div>
  );
}

export default TryPanel;
