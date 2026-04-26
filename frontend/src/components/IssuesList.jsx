import { motion } from "framer-motion";
import { WandSparkles } from "lucide-react";

const severityClass = {
  Critical: "critical",
  High: "high",
  Medium: "medium"
};

export default function IssuesList({ issues, onFix, isFixing }) {
  return (
    <div className="issues-list">
      <div className="section-heading">
        <h2>Detected Violations</h2>
        <button className="secondary-button" onClick={onFix} disabled={!issues.length || isFixing}>
          <WandSparkles size={17} />
          {isFixing ? "Generating fixes..." : "Fix with AI"}
        </button>
      </div>

      {issues.length === 0 ? (
        <p className="empty-state">No issues detected yet.</p>
      ) : (
        issues.map((issue, index) => (
          <motion.article
            className="issue-card"
            key={issue.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <span className={`severity ${severityClass[issue.severity]}`}>{issue.severity}</span>
            <h3>{issue.title}</h3>
            <code>{issue.snippet}</code>
            <p>{issue.suggestion}</p>
          </motion.article>
        ))
      )}
    </div>
  );
}
