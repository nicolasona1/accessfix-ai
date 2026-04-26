import { Code2, Globe2, PlayCircle } from "lucide-react";
import { demoHtml } from "../utils/htmlParser";

const tabs = [
  { id: "paste", label: "Paste HTML", icon: Code2 },
  { id: "url", label: "Enter URL", icon: Globe2 },
  { id: "demo", label: "Load Demo", icon: PlayCircle }
];

export default function HTMLInput({ activeTab, setActiveTab, html, setHtml, url, setUrl, onAnalyze, isLoading, error, notice, source }) {
  const loadDemo = () => {
    setHtml(demoHtml);
    setActiveTab("paste");
  };

  const canAnalyze = activeTab === "url" ? url.trim() : html.trim();
  const analyzeMode = activeTab === "url" ? "url" : "html";

  return (
    <section className="input-panel" aria-label="HTML input">
      <div className="tabs">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button className={`tab ${activeTab === id ? "active" : ""}`} key={id} onClick={() => setActiveTab(id)}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "paste" && (
        <textarea
          className="html-textarea"
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          spellCheck="false"
          placeholder={demoHtml}
        />
      )}

      {activeTab === "url" && (
        <div className="url-box">
          <input
            aria-label="Website URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
          />
          <p>FastAPI fetches the page HTML, parses it server-side, then sends the real markup back for simulation.</p>
        </div>
      )}

      {activeTab === "demo" && (
        <div className="demo-loader">
          <p>Load the broken contact form used in the pitch script.</p>
          <button className="secondary-button" onClick={loadDemo}>
            <PlayCircle size={18} />
            Load Broken Demo
          </button>
        </div>
      )}

      <div className="input-actions">
        <button className="primary-button" onClick={() => onAnalyze({ mode: analyzeMode })} disabled={!canAnalyze || isLoading}>
          {isLoading ? "Analyzing..." : "Analyze Accessibility"}
        </button>
        <span>{activeTab === "url" ? "The backend fetches one page only. No crawling or storage." : "No data stored. Your HTML never leaves your session."}</span>
      </div>
      {error && <p className="error-text">{error}</p>}
      {notice && <p className="notice-text">{notice}</p>}
      {source?.type === "url" && <p className="source-text">Analyzed: {source.title}</p>}
    </section>
  );
}
