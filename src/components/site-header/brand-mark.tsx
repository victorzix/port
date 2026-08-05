import { cn } from "@/lib/utils";

interface BrandMarkProps {
  condensed: boolean;
}

/** V knocked out of the brand square — the same mark used as the tab icon. */
const V_CLIP =
  "polygon(17% 17.5%, 37.8% 17.5%, 50% 54%, 62.2% 17.5%, 83% 17.5%, 58.5% 82.5%, 40% 82.5%)";

export function BrandMark({ condensed }: BrandMarkProps) {
  return (
    <a
      href="#top"
      aria-label="Victor Raphael — home"
      className="flex min-w-0 shrink items-center gap-[11px] text-foreground"
    >
      <span
        aria-hidden="true"
        className="relative block size-[30px] shrink-0 overflow-hidden bg-brand"
      >
        <span className="absolute inset-0 bg-background" style={{ clipPath: V_CLIP }} />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "truncate leading-[0.95] font-bold tracking-[-0.04em] transition-[font-size] duration-[380ms] ease-out",
            condensed ? "text-base sm:text-lg" : "text-lg sm:text-xl",
          )}
        >
          Victor Raphael
        </span>
        <span
          className={cn(
            "overflow-hidden font-mono text-[9.5px] tracking-[0.09em] text-brand uppercase transition-[height,opacity] duration-[280ms] ease-out",
            condensed ? "h-0 opacity-0" : "h-3 opacity-100",
          )}
        >
          Full Stack Dev
        </span>
      </span>
    </a>
  );
}
