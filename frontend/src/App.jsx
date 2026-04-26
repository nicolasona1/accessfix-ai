import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import AccessibilityScore from "./components/AccessibilityScore";
import IssuesList from "./components/IssuesList";
import SimulatorPanel from "./components/SimulatorPanel";
import FixSuggestions from "./components/FixSuggestions";
import BeforeAfter from "./components/BeforeAfter";
import { useAnalyzer } from "./hooks/useAnalyzer";

export default function App() {
  const [activeTab, setActiveTab] = useState("paste");
  const analyzer = useAnalyzer();

  return (
    <main>
      <Navbar />
      <HeroSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        html={analyzer.html}
        setHtml={analyzer.setHtml}
        url={analyzer.url}
        setUrl={analyzer.setUrl}
        onAnalyze={analyzer.analyze}
        isLoading={analyzer.isLoading}
        error={analyzer.error}
        notice={analyzer.notice}
        source={analyzer.source}
      />

      {analyzer.hasAnalyzed && (
        <motion.section className="dashboard" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}>
          <AccessibilityScore score={analyzer.score} summary={analyzer.summary} fixedScore={analyzer.fixedScore} />
          <IssuesList issues={analyzer.issues} onFix={analyzer.applyFixes} isFixing={analyzer.isFixing} />
        </motion.section>
      )}

      {analyzer.hasAnalyzed && (
        <>
          <SimulatorPanel beforeTokens={analyzer.beforeTokens} afterTokens={analyzer.afterTokens} fixedHtml={analyzer.fixedHtml} />
          <FixSuggestions fixes={analyzer.fixes} fixedHtml={analyzer.fixedHtml} />
          <BeforeAfter html={analyzer.html} fixedHtml={analyzer.fixedHtml} />
        </>
      )}
    </main>
  );
}
