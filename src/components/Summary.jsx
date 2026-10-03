import { useEffect, useRef, useState } from "react";

// Show transcript and summary after the call
function Summary({ lines, summary }) {
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef(null);

  // Scroll to summary when component loads
  useEffect(() => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  let jsonText = "";

  if (summary.loading) jsonText = "Creating summary...";
  else if (summary.error) jsonText = summary.error;
  else jsonText = JSON.stringify(summary.data, null, 2);

  // Copy JSON to clipboard
  function copyJson() {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="summary" ref={sectionRef}>
      <h2>After the call</h2>

      <div className="summary-grid">
        <div>
          <h3>Transcript</h3>

          <ol className="final-transcript">
            {lines.map((line, index) => (
              <li key={index}>
                <span className="time">{line.time} </span>
                <strong>{line.who === "agent" ? "Aria" : "Customer"}: </strong>
                {line.text}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3>Call outcome</h3>

          <pre className="summary-json">{jsonText}</pre>

          {summary.data && (
            <button className="btn btn-small" onClick={copyJson}>
              {copied ? "Copied" : "Copy JSON"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default Summary;
