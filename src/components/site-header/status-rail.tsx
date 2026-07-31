"use client";

import { useLocale, useTranslations } from "next-intl";

import { useLiveClock } from "@/hooks/use-live-clock";
import { cn } from "@/lib/utils";

interface StatusRailProps {
  condensed: boolean;
}

export function StatusRail({ condensed }: StatusRailProps) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const clock = useLiveClock(locale);

  return (
    <div
      className={cn(
        "overflow-hidden border-b border-border transition-[height,opacity] duration-[380ms] ease-out",
        condensed ? "h-0 opacity-0" : "h-[30px] opacity-100",
      )}
    >
      <div className="mx-auto flex h-[30px] max-w-[1320px] items-center gap-3 px-4 font-mono text-[9.5px] tracking-[0.09em] text-muted-foreground uppercase sm:px-16">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="size-[5px] shrink-0 animate-pulse rounded-full bg-emerald-500" />
          {t("status")}
        </span>
        <span className="h-2.5 w-px shrink-0 bg-border" />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {t("location")}
        </span>
        <span className="ml-auto shrink-0 tabular-nums tracking-[0.1em] whitespace-nowrap">
          {clock}
        </span>
      </div>
    </div>
  );
}
