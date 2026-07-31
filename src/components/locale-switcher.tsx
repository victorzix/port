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
            "flex w-full items-center gap-2.5 rounded-[2px] border-0 bg-transparent text-left tracking-[-0.012em] transition-colors hover:bg-muted",
            isMobile ? "min-h-[46px] px-2.5 text-[15px]" : "min-h-[34px] px-2.5 text-[13px]",
            cur === locale ? "font-semibold text-brand" : "font-medium text-foreground",
          )}
        >
          <LocaleFlag locale={cur} />
          <span className="font-mono text-[10.5px] tracking-[0.09em] text-muted-foreground">
            {cur.toUpperCase()}
          </span>
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
        className="flex h-9 items-center gap-1.5 rounded-[10px] border-0 bg-transparent px-1 text-foreground transition-opacity hover:opacity-60"
      >
        <LocaleFlag locale={locale} />
        <span className="font-mono text-[11px] font-medium tracking-[0.09em]">
          {locale.toUpperCase()}
        </span>
        <ChevronDown
          className={cn(
            "size-[9px] text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 z-40 min-w-[152px] origin-top-right animate-in fade-in slide-in-from-top-1 rounded-[3px] border border-border bg-popover p-1 shadow-lg duration-200">
          {options}
        </div>
      )}
    </div>
  );
}
