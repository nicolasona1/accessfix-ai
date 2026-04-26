import { Pause, Play, Volume2 } from "lucide-react";
import { useSpeech } from "../hooks/useSpeech";

function ChipColumn({ title, tokens, activeIndex, locked }) {
  return (
    <div className={`sim-column ${locked ? "locked" : ""}`}>
      <h3>{title}</h3>
      <div className="chips">
        {tokens.length ? tokens.map((token, index) => (
          <span className={`chip ${token.isIssue ? "bad-chip" : ""} ${activeIndex === index ? "speaking" : ""}`} key={`${token.text}-${index}`}>
            {token.text}
          </span>
        )) : <span className="muted-chip">{locked ? "Apply fixes to unlock" : "Analyze HTML to generate speech"}</span>}
      </div>
    </div>
  );
}

export default function SimulatorPanel({ beforeTokens, afterTokens, fixedHtml }) {
  const beforeSpeech = useSpeech();
  const afterSpeech = useSpeech();

  return (
    <section className="simulator">
      <div className="section-heading">
        <h2><Volume2 size={22} /> Screen Reader Simulation</h2>
      </div>
      <div className="sim-grid">
        <ChipColumn title="BEFORE — What blind users hear now" tokens={beforeTokens} activeIndex={beforeSpeech.activeIndex} />
        <ChipColumn title="AFTER — What they hear after fixes" tokens={afterTokens} activeIndex={afterSpeech.activeIndex} locked={!fixedHtml} />
      </div>
      <div className="listen-actions">
        <button className="primary-button" onClick={() => beforeSpeech.isSpeaking ? beforeSpeech.stop() : beforeSpeech.speak(beforeTokens)} disabled={!beforeTokens.length}>
          {beforeSpeech.isSpeaking ? <Pause size={18} /> : <Play size={18} />}
          Listen Before
        </button>
        <button className="primary-button green" onClick={() => afterSpeech.isSpeaking ? afterSpeech.stop() : afterSpeech.speak(afterTokens)} disabled={!afterTokens.length}>
          {afterSpeech.isSpeaking ? <Pause size={18} /> : <Play size={18} />}
          Listen After
        </button>
      </div>
    </section>
  );
}
