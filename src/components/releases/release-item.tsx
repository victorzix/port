import { useFormatter } from "next-intl";

import { MarkdownContent } from "@/components/markdown-content";
import { Reveal } from "@/components/motion/reveal";
import { ReleaseChangeList } from "@/components/releases/release-change-list";
import { versionAnchor } from "@/lib/version-key";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleaseItemProps {
  release: ReleaseView;
  /** Position in the timeline — drives the reveal stagger. */
  index?: number;
}

export function ReleaseItem({ release, index = 0 }: ReleaseItemProps) {
  const format = useFormatter();
  const anchor = versionAnchor(release.version);

  return (
    <Reveal
      as="article"
      id={anchor}
      delay={(index % 4) * 70}
      className="scroll-mt-28 border-t border-border py-6 sm:py-8"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <a
          href={`#${anchor}`}
          className="font-mono text-[15px] tracking-[0.02em] text-brand transition-opacity hover:opacity-70"
        >
          v{release.version}
        </a>
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
          {format.dateTime(release.releasedAt, "long")}
        </span>
      </div>

      {release.title && (
        <h3 className="mt-2 text-lg leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-xl">
          {release.title}
        </h3>
      )}

      <ReleaseChangeList changes={release.changes} />

      {release.notes && (
        <div className="mt-4">
          <MarkdownContent content={release.notes} />
        </div>
      )}
    </Reveal>
  );
}
