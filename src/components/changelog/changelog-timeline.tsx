import { useTranslations } from "next-intl";

import { ChangelogEntryItem } from "@/components/changelog/changelog-entry-item";
import type { ChangelogEntry } from "@/db/schema";

interface ChangelogTimelineProps {
  entries: ChangelogEntry[];
}

export function ChangelogTimeline({ entries }: ChangelogTimelineProps) {
  const t = useTranslations("ProjectDetail");

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("changelogEmpty")}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {entries.map((entry) => (
        <ChangelogEntryItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
