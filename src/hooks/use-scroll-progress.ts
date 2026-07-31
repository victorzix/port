"use client";

import { useEffect, useState } from "react";

interface ScrollProgress {
  progress: number;
  condensed: boolean;
}

export function useScrollProgress(): ScrollProgress {
  const [state, setState] = useState<ScrollProgress>({
    progress: 0,
    condensed: false,
  });

  useEffect(() => {
    function sync() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, y / max) : 0;
      const condensed = y > 56;

      setState((prev) =>
        prev.condensed === condensed &&
        Math.abs(prev.progress - progress) <= 0.002
          ? prev
          : { progress, condensed },
      );
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return state;
}
