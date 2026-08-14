import { useFormatter, useTranslations } from "next-intl";

import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import { MarkdownContent } from "@/components/markdown-content";
import { Reveal } from "@/components/motion/reveal";
import { ReleaseChangeList } from "@/components/releases/release-change-list";
import { ReleaseDisclosure } from "@/components/releases/release-disclosure";
import { ReleaseTierTag } from "@/components/releases/release-tier-tag";
import {
  TIER_TEXT_COLOR,
  TIER_VERSION_STYLE,
} from "@/components/releases/tier-styles";
import type { BumpTier } from "@/lib/version-bump";
import { versionAnchor } from "@/lib/version-key";
import { cn } from "@/lib/utils";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleaseItemProps {
  release: ReleaseView;
  /** Bump tier of this release, driving its size, color, and tag. */
  tier: BumpTier;
  /** Whether this release starts expanded (the newest one does). */
  defaultOpen: boolean;
  /** Position in the timeline — drives the reveal stagger. */
  index?: number;
}

export function ReleaseItem({
  release,
  tier,
  defaultOpen,
  index = 0,
}: ReleaseItemProps) {
  const format = useFormatter();
  const t = useTranslations("ProjectDetail");
  const anchor = versionAnchor(release.version);

  const header = (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="flex items-center gap-2">
          <a
            href={`#${anchor}`}
            className={cn(
              "font-mono tracking-[0.02em] transition-opacity hover:opacity-70",
              TIER_VERSION_STYLE[tier],
              TIER_TEXT_COLOR[tier],
            )}
          >
            v{release.version}
          </a>
          <ReleaseTierTag tier={tier} />
        </div>
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
          {format.dateTime(release.releasedAt, "long")}
        </span>
      </div>

      {release.title && (
        <h3 className="mt-2 text-lg leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-xl">
          {release.title.text}
          {release.title.isFallback && (
            <LocalizedFallbackTag sourceLocale={release.title.sourceLocale} />
          )}
        </h3>
      )}
    </>
  );

  return (
    <Reveal
      as="article"
      id={anchor}
      delay={(index % 4) * 70}
      className="relative scroll-mt-28 py-6 before:absolute before:left-[-20px] before:top-[26px] before:size-2 before:rounded-full before:bg-brand sm:py-8"
    >
      <ReleaseDisclosure
        defaultOpen={defaultOpen}
        anchorId={anchor}
        labels={{ expand: t("releaseExpand"), collapse: t("releaseCollapse") }}
        header={header}
      >
        <ReleaseChangeList changes={release.changes} />
        {release.notes && (
          <div className="mt-4">
            <MarkdownContent content={release.notes.text} />
            {release.notes.isFallback && (
              <LocalizedFallbackTag sourceLocale={release.notes.sourceLocale} />
            )}
          </div>
        )}
      </ReleaseDisclosure>
    </Reveal>
  );
}
