const labelFor = (score) => {
  if (score <= 40) return "Inaccessible";
  if (score <= 70) return "Needs Work";
  if (score <= 89) return "Getting There";
  return "Accessible";
};

const colorFor = (score) => {
  if (score <= 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  if (score <= 89) return "#eab308";
  return "#22c55e";
};

export default function AccessibilityScore({ score, summary, fixedScore }) {
  const color = colorFor(score);
  return (
    <div className="score-card">
      <div className="score-dial" style={{ "--score": score, "--score-color": color }}>
        <div>
          <strong>{score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <h2>{score} / 100 — {labelFor(score)}</h2>
      <p className="summary-line">{summary.Critical} Critical · {summary.High} High · {summary.Medium} Medium</p>
      {fixedScore !== null && (
        <div className="fixed-score">
          After fixes: <strong>{fixedScore} / 100 — {labelFor(fixedScore)}</strong>
        </div>
      )}
    </div>
  );
}
