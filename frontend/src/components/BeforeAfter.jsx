export default function BeforeAfter({ html, fixedHtml }) {
  if (!fixedHtml) return null;

  return (
    <section className="output-section">
      <h2>Fixed HTML Output</h2>
      <div className="code-compare">
        <div>
          <h3>Original</h3>
          <pre>{html}</pre>
        </div>
        <div>
          <h3>Fixed</h3>
          <pre>{fixedHtml}</pre>
        </div>
      </div>
    </section>
  );
}
