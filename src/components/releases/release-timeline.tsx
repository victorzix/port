import { useTranslations } from "next-intl";

import { ReleaseItem } from "@/components/releases/release-item";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleaseTimelineProps {
  releases: ReleaseView[];
}

export function ReleaseTimeline({ releases }: ReleaseTimelineProps) {
  const t = useTranslations("ProjectDetail");

  if (releases.length === 0) {
    return (
      <p className="mt-6 border-t border-border pt-6 text-[14px] leading-[1.6] text-muted-foreground sm:text-[15.5px]">
        {t("releasesEmpty")}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col sm:mt-8">
      {releases.map((release, index) => (
        <ReleaseItem key={release.id} release={release} index={index} />
      ))}
    </div>
  );
}
