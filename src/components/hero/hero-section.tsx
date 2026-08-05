import { useTranslations } from "next-intl";

import { HeroBackdrop } from "@/components/hero/hero-backdrop";
import { HeroFacts } from "@/components/hero/hero-facts";
import { TypedKicker } from "@/components/hero/typed-kicker";

export function HeroSection() {
  const t = useTranslations("Hero");
  const facts = t.raw("facts") as { label: string; value: string; note: string }[];
  const kickers = (t.raw("kickers") as string[] | undefined) ?? [t("kicker")];

  return (
    <div id="top" className="pt-2">
      <div className="relative">
        <HeroBackdrop />
        <p className="relative mb-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.11em] text-muted-foreground uppercase sm:mb-7">
          <span className="h-px w-[18px] bg-brand" />
          <TypedKicker words={kickers} />
        </p>

        <h1 className="relative max-w-[18ch] text-[34px] leading-[1.02] font-bold tracking-[-0.045em] text-balance text-foreground sm:text-6xl lg:text-7xl">
          {t("title")}
        </h1>

        <p className="relative mt-5 max-w-[56ch] text-[15.5px] leading-[1.55] tracking-[-0.012em] text-pretty text-muted-foreground sm:mt-7 sm:text-lg">
          {t("lead")}
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2.5 sm:mt-10">
        <a
          href="#experience"
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
    </div>
  );
}
