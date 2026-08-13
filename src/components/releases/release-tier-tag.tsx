import { useTranslations } from "next-intl";

import { TIER_TEXT_COLOR } from "@/components/releases/tier-styles";
import type { BumpTier } from "@/lib/version-bump";
import { cn } from "@/lib/utils";

interface ReleaseTierTagProps {
  tier: BumpTier;
}

export function ReleaseTierTag({ tier }: ReleaseTierTagProps) {
  const t = useTranslations("ReleaseBump");

  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="text-border">
        │
      </span>
      <span
        className={cn(
          "font-mono text-[9px] tracking-[0.14em] uppercase",
          TIER_TEXT_COLOR[tier],
        )}
      >
        {t(tier)}
      </span>
    </span>
  );
}
