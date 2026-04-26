import { motion } from "framer-motion";
import HTMLInput from "./HTMLInput";

export default function HeroSection(props) {
  return (
    <header className="hero">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="hero-copy">
        <h1>Paste your HTML. Hear the barriers. Fix them in minutes.</h1>
        <p className="hero-text">
          A developer tool that turns accessibility audits into an experience you can hear, understand, and improve.
        </p>
      </motion.div>
      <HTMLInput {...props} />
    </header>
  );
}
