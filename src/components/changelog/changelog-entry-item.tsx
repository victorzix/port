import { useFormatter, useTranslations } from "next-intl";

import { MarkdownContent } from "@/components/changelog/markdown-content";
import type { ChangelogEntry } from "@/db/schema";

interface ChangelogEntryItemProps {
  entry: ChangelogEntry;
}

export function ChangelogEntryItem({ entry }: ChangelogEntryItemProps) {
  const t = useTranslations("ChangelogEntry");
  const format = useFormatter();
  const anchorId = `entry-${entry.id}`;

  return (
    <article id={anchorId} className="scroll-mt-20 border-b pb-8 last:border-b-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h3 className="text-base font-semibold sm:text-lg">{entry.title}</h3>
        <a
          href={`#${anchorId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {t("publishedOn", { date: format.dateTime(entry.publishedAt, "long") })}
        </a>
      </div>
      <div className="mt-3">
        <MarkdownContent content={entry.body} />
      </div>
    </article>
  );
}
