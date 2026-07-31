"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

import { useThemeStore, type Theme } from "@/stores/use-theme-store";

let hasHydrated = false;

function hydrateInitialTheme() {
  if (hasHydrated) return;
  hasHydrated = true;

  const hadStoredPreference = localStorage.getItem("pf-theme") !== null;
  useThemeStore.persist.rehydrate();

  if (!hadStoredPreference) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    useThemeStore.getState().setTheme(prefersDark ? "dark" : "light");
  }
}

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    hydrateInitialTheme();
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const button = toggleButtonRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      typeof document.startViewTransition !== "function" ||
      !button ||
      root.dataset.themeVt === "active" ||
      prefersReducedMotion
    ) {
      setTheme(next);
      return;
    }

    const { innerWidth: vw, innerHeight: vh } = window;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const maxRadius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
    const at = `${(x / vw) * 100}% ${(y / vh) * 100}%`;
    const radius = (maxRadius / (Math.hypot(vw, vh) / Math.SQRT2)) * 100;
    const clipPath = [`circle(0% at ${at})`, `circle(${radius}% at ${at})`];

    root.dataset.themeVt = "active";
    root.style.setProperty("--theme-vt-clip-from", clipPath[0]);
    const cleanup = () => {
      delete root.dataset.themeVt;
      root.style.removeProperty("--theme-vt-clip-from");
    };

    const transition = document.startViewTransition(() => {
      setTheme(next);
    });
    transition.finished.finally(cleanup).catch(() => {});
    transition.ready
      .then(() => {
        root.animate(
          { clipPath },
          {
            duration: 520,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
  }, [theme, setTheme]);

  return { theme, toggleTheme, toggleButtonRef };
}
