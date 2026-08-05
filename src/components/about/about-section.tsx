import { useTranslations } from "next-intl";

import { AboutMethod } from "@/components/about/about-method";
import { Reveal } from "@/components/motion/reveal";

export function AboutSection() {
  const t = useTranslations("About");
  const method = t.raw("method") as string[];

  return (
    <Reveal as="section" id="about" className="mt-11 scroll-mt-28 sm:mt-18">
      <div className="mb-3.5 flex items-baseline gap-3 sm:mb-5">
        <span className="font-mono text-[10px] tracking-[0.12em] text-brand">01</span>
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          {t("label")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-[1fr_184px] lg:gap-x-10">
        <div className="min-w-0">
          <h2 className="max-w-[20ch] text-[28px] leading-[1.04] font-bold tracking-[-0.042em] text-balance text-foreground sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-[58ch] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-pretty text-muted-foreground sm:mt-5.5 sm:text-[17px]">
            {t("body")}
          </p>
          <p className="mt-3 max-w-[58ch] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-pretty text-muted-foreground sm:mt-4 sm:text-[17px]">
            {t("body2")}
          </p>
        </div>

        <AboutMethod label={t("methodLabel")} items={method} />
      </div>
    </Reveal>
  );
}
