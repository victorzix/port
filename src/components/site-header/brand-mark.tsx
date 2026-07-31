import { cn } from "@/lib/utils";

interface BrandMarkProps {
  condensed: boolean;
}

export function BrandMark({ condensed }: BrandMarkProps) {
  return (
    <a
      href="#top"
      aria-label="Victor Raphael — home"
      className="flex min-w-0 shrink flex-col gap-0.5 text-foreground"
    >
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
    </a>
  );
}
