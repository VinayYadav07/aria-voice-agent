import { useEffect, useRef } from "react";

// Conversation component
function Conversation({ lines }) {
  const boxRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="conversation" ref={boxRef}>
      {lines.length === 0 && (
        <p className="muted">The conversation will show here.</p>
      )}

      {lines.map((line, index) => (
        <div key={index} className={"msg " + line.who}>
          <span className="msg-who">
            {line.who === "agent" ? "Aria" : "You"}
          </span>
          {line.text}
        </div>
      ))}
    </div>
  );
}

export default Conversation;
