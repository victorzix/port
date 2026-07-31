"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { LOCALES, type Locale } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LocaleFlag } from "@/components/locale-flag";
import { cn } from "@/lib/utils";

const NATIVE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

interface LocaleSwitcherProps {
  size?: "compact" | "mobile";
}

export function LocaleSwitcher({ size = "compact" }: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobile = size === "mobile";

  function onChange(nextLocale: Locale) {
    router.replace(pathname, { locale: nextLocale });
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const options = (
    <div
      role="listbox"
      aria-label={t("label")}
      className={cn("flex flex-col", isMobile ? "gap-1" : "gap-0.5")}
    >
      {LOCALES.map((cur) => (
        <button
          key={cur}
          type="button"
          role="option"
          aria-selected={cur === locale}
          onClick={() => onChange(cur)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-[9px] border border-transparent text-left tracking-[-0.012em] transition-colors",
            isMobile
              ? "min-h-12 px-3 text-[15px]"
              : "min-h-[38px] px-3 text-[13.5px]",
            cur === locale
              ? "border-brand/45 bg-brand/[0.14] font-semibold text-foreground"
              : "font-medium text-muted-foreground hover:bg-muted",
          )}
        >
          <LocaleFlag locale={cur} />
          <span>{NATIVE_NAMES[cur]}</span>
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return options;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        className="flex h-9 items-center gap-2.5 rounded-[10px] border border-border bg-muted px-2.5 pr-2.5 text-[13px] font-semibold tracking-[-0.012em] text-foreground transition-colors hover:border-border/80"
      >
        <LocaleFlag locale={locale} />
        <span>{NATIVE_NAMES[locale]}</span>
        <ChevronDown
          className={cn("size-[11px] transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-40 min-w-[178px] origin-top-right animate-in fade-in slide-in-from-top-1 rounded-[13px] border border-border bg-popover p-[5px] shadow-lg duration-200">
          {options}
        </div>
      )}
    </div>
  );
}
