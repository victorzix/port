"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { BrandMark } from "@/components/site-header/brand-mark";
import { DesktopNav } from "@/components/site-header/desktop-nav";
import { MobileMenuButton } from "@/components/site-header/mobile-menu-button";
import { MobileSheet } from "@/components/site-header/mobile-sheet";
import { ThemeToggleButton } from "@/components/site-header/theme-toggle-button";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("Nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const { progress, condensed: scrolledCondensed } = useScrollProgress();
  const condensed = scrolledCondensed && !menuOpen;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/86 backdrop-blur-md backdrop-saturate-150">
      <div
        className={cn(
          "mx-auto flex max-w-[1080px] items-center gap-3 px-4 transition-[height] duration-[380ms] ease-out sm:px-16",
          condensed ? "h-14 sm:h-16" : "h-[66px] sm:h-[84px]",
        )}
      >
        <BrandMark condensed={condensed} />
        <DesktopNav />

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>
          <span className="mx-1.5 hidden h-[18px] w-px bg-border lg:block" />
          <ThemeToggleButton />
          <a
            href="#contact"
            className="hidden h-10 items-center gap-2.5 rounded-full border border-border pr-1.5 pl-4 text-[13px] font-semibold tracking-[-0.01em] text-foreground transition-colors hover:border-brand hover:bg-muted lg:inline-flex"
          >
            {t("cta")}
            <span className="grid size-[26px] place-items-center rounded-full bg-brand text-xs text-white">
              →
            </span>
          </a>
          <MobileMenuButton open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
        </div>
      </div>

      <div className="h-0.5 overflow-hidden">
        <div
          className="h-full origin-left bg-brand transition-transform duration-100 ease-linear"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {menuOpen && <MobileSheet onClose={() => setMenuOpen(false)} />}
    </header>
  );
}
