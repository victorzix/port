import { useTranslations } from "next-intl";

import { HeroFacts } from "@/components/hero/hero-facts";
import { TechChipList } from "@/components/shared/tech-chip-list";

const CORE_STACK = [
  "TypeScript",
  "Node.js",
  "NestJS",
  "React",
  "Next.js",
  "PostgreSQL",
  "Docker",
];

export function HeroSection() {
  const t = useTranslations("Hero");
  const facts = t.raw("facts") as { label: string; value: string; note: string }[];

  return (
    <div id="top" className="pt-2">
      <p className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.11em] text-muted-foreground uppercase sm:mb-7">
        <span className="h-px w-[18px] bg-brand" />
        {t("kicker")}
      </p>

      <h1 className="max-w-[18ch] text-[34px] leading-[1.02] font-bold tracking-[-0.045em] text-balance text-foreground sm:text-6xl lg:text-7xl">
        {t("title")}
      </h1>

      <p className="mt-5 max-w-[56ch] text-[15.5px] leading-[1.55] tracking-[-0.012em] text-pretty text-muted-foreground sm:mt-7 sm:text-lg">
        {t("lead")}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-2.5 sm:mt-10">
        <a
          href="#work"
          className="inline-flex min-h-[52px] items-center gap-3 rounded-full bg-brand px-5.5 text-[15px] font-semibold tracking-[-0.015em] text-white transition-[filter,transform] hover:brightness-110 active:translate-y-0"
        >
          {t("ctaWork")}
          <span className="text-sm">↓</span>
        </a>
        <a
          href="https://github.com/victorzix"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center rounded-full border border-border px-5 text-[15px] font-medium tracking-[-0.015em] text-foreground transition-colors hover:border-brand hover:bg-muted"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/victorphael"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center rounded-full border border-border px-5 text-[15px] font-medium tracking-[-0.015em] text-foreground transition-colors hover:border-brand hover:bg-muted"
        >
          LinkedIn
        </a>
      </div>

      <HeroFacts facts={facts} />

      <div className="mt-10 flex flex-col gap-3.5 sm:mt-16">
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          {t("stackLabel")}
        </span>
        <TechChipList items={CORE_STACK} />
      </div>
    </div>
  );
}
