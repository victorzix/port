import { useTranslations } from "next-intl";

import { TIER_TEXT_COLOR } from "@/components/releases/tier-styles";
import type { ReleaseGroup } from "@/lib/release-grouping";
import { versionAnchor } from "@/lib/version-key";
import { cn } from "@/lib/utils";

interface ReleaseIndexProps {
  groups: ReleaseGroup[];
}

export function ReleaseIndex({ groups }: ReleaseIndexProps) {
  const t = useTranslations("ProjectDetail");

  if (groups.length < 2) return null;

  return (
    <nav
      aria-label={t("releaseIndexLabel")}
      className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
    >
      {groups.map((group) => (
        <a
          key={group.anchor.id}
          href={`#${versionAnchor(group.anchor.version)}`}
          className={cn(
            "font-mono text-[12px] tracking-[0.02em] transition-opacity hover:opacity-70",
            TIER_TEXT_COLOR[group.tier],
          )}
        >
          v{group.anchor.version}
        </a>
      ))}
    </nav>
  );
}
