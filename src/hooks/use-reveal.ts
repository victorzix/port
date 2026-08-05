"use client";

import { useEffect, useRef } from "react";

/**
 * Fade + rise on scroll, driven by a `data-reveal` attribute the caller styles.
 *
 * The attribute is set from the effect rather than from React state so the
 * server-rendered markup stays visible: without JS (or with reduced motion) the
 * content never gets hidden. Elements already on screen at mount are marked
 * shown straight away, so nothing flashes above the fold.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const viewport = window.innerHeight || 800;
    const rect = element.getBoundingClientRect();
    if (rect.top < viewport && rect.bottom > 0) return;

    element.dataset.reveal = "hidden";

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        element.dataset.reveal = "shown";
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      delete element.dataset.reveal;
    };
  }, []);

  return ref;
}
