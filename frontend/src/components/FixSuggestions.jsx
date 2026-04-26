import { CheckCircle2, Clipboard } from "lucide-react";

export default function FixSuggestions({ fixes, fixedHtml }) {
  const copy = async () => {
    if (fixedHtml) await navigator.clipboard.writeText(fixedHtml);
  };

  if (!fixes.length) return null;

  return (
    <section className="fix-panel">
      <div className="section-heading">
        <h2><CheckCircle2 size={21} /> AI Fix Panel</h2>
        <button className="secondary-button" onClick={copy}>
          <Clipboard size={17} />
          Copy Fixed HTML
        </button>
      </div>
      <p className="disclaimer">AI-generated — please review before publishing. Image descriptions are marked with data-ai-suggested.</p>
      <div className="fix-grid">
        {fixes.map((fix) => (
          <article className="fix-card" key={fix.id}>
            <span>{fix.confidence}</span>
            <code className="before">{fix.snippet}</code>
            <code className="after">{fix.fixed_html}</code>
            <p>{fix.explanation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
