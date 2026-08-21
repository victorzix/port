import { useTranslations } from "next-intl";

import { ExpandableMockup } from "@/components/projects/expandable-mockup";
import { ChangeTypeGlyph } from "@/components/releases/change-type-glyph";
import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import { cn } from "@/lib/utils";
import type { ReleaseChangeView } from "@/server/view-models/project";

interface ReleaseChangeListProps {
  changes: ReleaseChangeView[];
}

export function ReleaseChangeList({ changes }: ReleaseChangeListProps) {
  const t = useTranslations("ReleaseChange");

  if (changes.length === 0) return null;

  return (
    <ul className="mt-3.5 flex flex-col gap-2">
      {changes.map((change) => {
        const isPhone =
          change.image?.frame === "iphone" || change.image?.frame === "android";
        return (
          <li
            key={change.id}
            className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-2.5"
          >
            <div className="flex items-center gap-2 sm:contents">
              <ChangeTypeGlyph type={change.type} />
              <span className="font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground uppercase sm:w-24 sm:shrink-0">
                {t(`type.${change.type}`)}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <span className="text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-foreground sm:text-[15px]">
                {change.text.text}
                {change.text.isFallback && (
                  <LocalizedFallbackTag sourceLocale={change.text.sourceLocale} />
                )}
              </span>
              {change.image && (
                <ExpandableMockup
                  image={change.image}
                  className={cn(isPhone ? "max-w-[220px]" : "max-w-[600px]")}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
