// Show the tools used by Aria
function ToolCalls({ logs }) {
  // Show the latest tool call first
  const latestFirst = [...logs].reverse();

  return (
    <div className="box">
      <h2>Tool calls</h2>

      <ul className="tool-list">
        {logs.length === 0 && <li className="muted">No tool calls yet.</li>}

        {latestFirst.map((log, index) => (
          <li key={index}>
            <span className="tool-name">
              {log.name}({log.args.order_id || ""})
            </span>{" "}
            → {JSON.stringify(log.result)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ToolCalls;
