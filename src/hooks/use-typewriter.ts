"use client";

import { useEffect, useRef, useState } from "react";

export function useTypewriter(words: string[]): string {
  const [text, setText] = useState(words[0] ?? "");
  const wordsRef = useRef(words);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(wordsRef.current[0] ?? "");
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const state = { wordIndex: 0, charCount: 0, deleting: false };

    function tick() {
      const list = wordsRef.current;
      if (!list.length) return;
      if (state.wordIndex >= list.length) state.wordIndex = 0;
      const full = list[state.wordIndex];
      let delay = 52 + Math.random() * 45;

      if (!state.deleting) {
        state.charCount++;
        if (state.charCount >= full.length) {
          state.deleting = true;
          delay = 2800;
        }
      } else {
        state.charCount--;
        delay = 24;
        if (state.charCount <= 0) {
          state.deleting = false;
          state.wordIndex = (state.wordIndex + 1) % list.length;
          delay = 380;
        }
      }

      setText(full.slice(0, Math.max(0, state.charCount)));
      timer = setTimeout(tick, delay);
    }

    setText("");
    timer = setTimeout(tick, 650);
    return () => clearTimeout(timer);
  }, []);

  return text;
}
