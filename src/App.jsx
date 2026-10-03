import useVoiceCall from "./hooks/useVoiceCall.js";
import Orb from "./components/Orb.jsx";
import Conversation from "./components/Conversation.jsx";
import OrdersPanel from "./components/OrdersPanel.jsx";
import TryPanel from "./components/TryPanel.jsx";
import ToolCalls from "./components/ToolCalls.jsx";
import Summary from "./components/Summary.jsx";

// Main App component
function App() {
  const call = useVoiceCall();

  return (
    <>
      <header className="topbar">
        <p className="brand">Aura Skincare</p>
        <p className="brand-sub">Voice support demo</p>
      </header>

      {!call.isSupported && (
        <p className="warning">
          Your browser does not support voice input. Please open this page in
          Google Chrome or Microsoft Edge on a computer.
        </p>
      )}

      <main className="layout">
        <section className="call-panel">
          <h1>Talk to Aria</h1>

          <p className="intro">
            Aria answers questions about orders, shipping, returns, cancellation
            and cash on delivery.
          </p>

          <Orb status={call.status} hint={call.hint} onClick={call.interrupt} />

          <div className="buttons">
            <button
              className="btn btn-start"
              onClick={call.startCall}
              disabled={call.inCall || !call.isSupported}
            >
              Start call
            </button>

            <button
              className="btn btn-end"
              onClick={call.endCall}
              disabled={!call.inCall}
            >
              End call
            </button>
          </div>

          <p className="live-text">{call.liveText}</p>

          {call.error && <p className="error">{call.error}</p>}

          <Conversation lines={call.lines} />
        </section>

        <aside className="side">
          <OrdersPanel />
          <TryPanel />
          <ToolCalls logs={call.toolLogs} />
        </aside>
      </main>

      {call.summary && <Summary lines={call.lines} summary={call.summary} />}

      <footer className="footer">
        Works best in Chrome or Edge on a computer. Made by Vinay Kumar Yadav.
      </footer>
    </>
  );
}

export default App;
