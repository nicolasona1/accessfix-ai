import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cancelRef = useRef(false);

  const stop = useCallback(() => {
    cancelRef.current = true;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setActiveIndex(-1);
  }, []);

  const speak = useCallback(async (tokens) => {
    if (!("speechSynthesis" in window)) return;
    stop();
    cancelRef.current = false;
    setIsSpeaking(true);

    for (let index = 0; index < tokens.length; index += 1) {
      if (cancelRef.current) break;
      setActiveIndex(index);
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(tokens[index].text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
      });
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setIsSpeaking(false);
    setActiveIndex(-1);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { activeIndex, isSpeaking, speak, stop };
}
