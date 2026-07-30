"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { routing, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(nextLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex flex-wrap gap-1 text-sm"
    >
      {routing.locales.map((cur) => (
        <button
          key={cur}
          type="button"
          aria-current={cur === locale}
          disabled={isPending || cur === locale}
          onClick={() => onChange(cur)}
          className={cn(
            "rounded-md px-2 py-1 uppercase transition-colors disabled:cursor-default",
            cur === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {cur}
        </button>
      ))}
    </div>
  );
}
