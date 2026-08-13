import { useTranslations } from "next-intl";

import { ReleaseItem } from "@/components/releases/release-item";
import { ReleasePatchGroup } from "@/components/releases/release-patch-group";
import type { ReleaseGroup } from "@/lib/release-grouping";

interface ReleaseTimelineProps {
  groups: ReleaseGroup[];
}

export function ReleaseTimeline({ groups }: ReleaseTimelineProps) {
  const t = useTranslations("ProjectDetail");

  if (groups.length === 0) {
    return (
      <p className="mt-6 border-t border-border pt-6 text-[14px] leading-[1.6] text-muted-foreground sm:text-[15.5px]">
        {t("releasesEmpty")}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col sm:mt-8">
      {groups.map((group, index) => (
        <div key={group.anchor.id}>
          <ReleaseItem release={group.anchor} tier={group.tier} index={index} />
          <ReleasePatchGroup patches={group.patches} />
        </div>
      ))}
    </div>
  );
}
