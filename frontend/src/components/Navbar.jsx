import { Accessibility, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="brand">
        <Accessibility size={24} />
        <span>AccessFix AI</span>
      </div>
      <div className="tagline">
        <Sparkles size={16} />
        Hear what blind users hear. Fix it instantly.
      </div>
    </nav>
  );
}
