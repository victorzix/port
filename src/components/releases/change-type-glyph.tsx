import type { ChangeType } from "@/lib/project-enums";
import { cn } from "@/lib/utils";

const GLYPHS: Record<ChangeType, string> = {
  added: "+",
  changed: "~",
  fixed: "✓",
  removed: "−",
  deprecated: "!",
  security: "△",
};

const COLORS: Record<ChangeType, string> = {
  added: "text-brand",
  changed: "text-foreground",
  fixed: "text-foreground",
  removed: "text-muted-foreground",
  deprecated: "text-muted-foreground",
  security: "text-brand",
};

interface ChangeTypeGlyphProps {
  type: ChangeType;
}

export function ChangeTypeGlyph({ type }: ChangeTypeGlyphProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "w-3 shrink-0 text-center font-mono text-[12px] leading-[1.6]",
        COLORS[type],
      )}
    >
      {GLYPHS[type]}
    </span>
  );
}
