import { useTranslations } from "next-intl";

import { ChangeTypeGlyph } from "@/components/releases/change-type-glyph";
import type { ReleaseChangeView } from "@/server/view-models/project";

interface ReleaseChangeListProps {
  changes: ReleaseChangeView[];
}

export function ReleaseChangeList({ changes }: ReleaseChangeListProps) {
  const t = useTranslations("ReleaseChange");

  if (changes.length === 0) return null;

  return (
    <ul className="mt-3.5 flex flex-col gap-2">
      {changes.map((change) => (
        <li key={change.id} className="flex items-baseline gap-2.5">
          <ChangeTypeGlyph type={change.type} />
          <span className="font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground uppercase sm:w-24 sm:shrink-0">
            {t(`type.${change.type}`)}
          </span>
          <span className="min-w-0 text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-foreground sm:text-[15px]">
            {change.text}
          </span>
        </li>
      ))}
    </ul>
  );
}
