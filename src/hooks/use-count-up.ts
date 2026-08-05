"use client";

import { useEffect, useRef } from "react";

const DURATION = 900;
const NUMBER_PATTERN = /-?\d+([.,]\d+)?/;

/**
 * Counts the first number inside `value` up from zero the first time the node
 * scrolls into view, preserving whatever surrounds it ("−106 h" → "0 h" … "−106 h").
 * The server-rendered text is the final value, so no-JS and crawlers see the real number.
 */
export function useCountUp<T extends HTMLElement>(value: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const match = value.match(NUMBER_PATTERN);
    if (!match || match.index === undefined) return;

    const target = Number.parseFloat(match[0].replace(",", "."));
    if (!Number.isFinite(target) || target === 0) return;

    const before = value.slice(0, match.index);
    const after = value.slice(match.index + match[0].length);
    const decimals = /[.,]/.test(match[0]) ? 1 : 0;
    const format = (amount: number) => before + amount.toFixed(decimals) + after;

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = format(target * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
      else element.textContent = value;
    };

    // Park at zero as soon as we take over, so scrolling into view never flashes
    // the final value before the count starts.
    element.textContent = format(0);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        frame = requestAnimationFrame(step);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.textContent = value;
    };
  }, [value]);

  return ref;
}
