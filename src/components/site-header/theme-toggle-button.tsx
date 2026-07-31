"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { useTheme } from "@/hooks/use-theme";

export function ThemeToggleButton() {
  const t = useTranslations("Nav");
  const { theme, toggleTheme, toggleButtonRef } = useTheme();
  const label = theme === "dark" ? t("themeToLight") : t("themeToDark");

  return (
    <button
      type="button"
      ref={toggleButtonRef}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="grid size-11 shrink-0 place-items-center rounded-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-brand"
    >
      {theme === "dark" ? (
        <Moon className="size-[18px]" strokeWidth={1.7} />
      ) : (
        <Sun className="size-[18px]" strokeWidth={1.7} />
      )}
    </button>
  );
}
