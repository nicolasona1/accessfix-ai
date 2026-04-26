import { useMemo, useState } from "react";
import { applyAccessibleFixes, buildFixCards, calculateScore, generateScreenReaderScript, parseAccessibilityIssues, summarizeIssues } from "../utils/htmlParser";

export function useAnalyzer() {
  const [html, setHtml] = useState("");
  const [url, setUrl] = useState("");
  const [fixedHtml, setFixedHtml] = useState("");
  const [issues, setIssues] = useState([]);
  const [fixes, setFixes] = useState([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState(null);

  const resetResultState = () => {
    setFixes([]);
    setFixedHtml("");
    setError("");
    setNotice("");
    setSource(null);
  };

  const withIds = (found) => found.map((item, index) => ({
    ...item,
    id: item.id || `${item.type}-${index}`
  }));

  const readJson = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(response.ok ? "Server returned invalid JSON" : text);
    }
  };

  const analyze = async ({ mode = "html" } = {}) => {
    resetResultState();
    setIsLoading(true);

    try {
      if (mode === "url") {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });

        const payload = await readJson(response);
        if (!response.ok) throw new Error(payload.detail || "Unable to analyze URL");

        setHtml(payload.html);
        setIssues(withIds(payload.issues));
        setSource({
          type: "url",
          url: payload.source_url || url,
          title: payload.page_title || payload.source_url || url
        });
      } else {
        const found = parseAccessibilityIssues(html);
        setIssues(found);
        setSource({ type: "html", title: "Pasted HTML" });
      }

      setHasAnalyzed(true);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFixes = async () => {
    setIsFixing(true);
    setError("");
    setNotice("");
    const nextHtml = applyAccessibleFixes(html);
    setFixedHtml(nextHtml);

    try {
      const aiFixes = await Promise.all(issues.map(async (issue) => {
        const response = await fetch("/api/fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issue_type: issue.type,
            snippet: issue.snippet,
            context: html.slice(0, 6000)
          })
        });

        const payload = await readJson(response);
        if (!response.ok) throw new Error(payload.detail || "Unable to generate AI fix");

        return {
          ...issue,
          fixed_html: payload.fixed_html,
          explanation: payload.explanation,
          confidence: payload.confidence
        };
      }));

      if (aiFixes.some((fix) => fix.confidence === "Local Fix")) {
        setNotice("Model services are unavailable in this demo environment. The app is showing reviewable local accessibility fixes so the presentation can continue.");
      }
      setFixes(aiFixes);
    } catch (caught) {
      setError(`${caught.message}. Showing local fallback fixes.`);
      setFixes(buildFixCards(issues));
    } finally {
      setIsFixing(false);
    }
  };

  const beforeTokens = useMemo(() => generateScreenReaderScript(html), [html]);
  const afterTokens = useMemo(() => generateScreenReaderScript(fixedHtml), [fixedHtml]);
  const score = useMemo(() => calculateScore(issues), [issues]);
  const fixedScore = useMemo(() => fixedHtml ? calculateScore(parseAccessibilityIssues(fixedHtml)) : null, [fixedHtml]);
  const summary = useMemo(() => summarizeIssues(issues), [issues]);

  return {
    html,
    setHtml,
    url,
    setUrl,
    fixedHtml,
    issues,
    fixes,
    hasAnalyzed,
    isLoading,
    isFixing,
    error,
    notice,
    source,
    analyze,
    applyFixes,
    beforeTokens,
    afterTokens,
    score,
    fixedScore,
    summary
  };
}
