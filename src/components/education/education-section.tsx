import { useTranslations } from "next-intl";

import { EducationItem } from "@/components/education/education-item";
import { LanguagesRail } from "@/components/education/languages-rail";
import { Reveal } from "@/components/motion/reveal";

interface Education {
  period: string;
  course: string;
  institution: string;
}

interface Language {
  name: string;
  level: string;
}

export function EducationSection() {
  const t = useTranslations("Education");
  const items = t.raw("items") as Education[];
  const languages = t.raw("languages") as Language[];

  return (
    <Reveal as="section" id="education" className="mt-11 scroll-mt-28 sm:mt-18">
      <div className="mb-3.5 flex items-baseline gap-3 sm:mb-5">
        <span className="font-mono text-[10px] tracking-[0.12em] text-brand">03</span>
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          {t("label")}
        </span>
      </div>

      <h2 className="max-w-[20ch] text-[28px] leading-[1.04] font-bold tracking-[-0.042em] text-balance text-foreground sm:text-5xl">
        {t("title")}
      </h2>

      <div className="mt-7 grid grid-cols-1 gap-y-8 lg:grid-cols-[1fr_184px] lg:gap-x-10">
        <div className="flex flex-col">
          {items.map((education, index) => (
            <EducationItem key={education.course} education={education} index={index} />
          ))}
        </div>

        <LanguagesRail label={t("langLabel")} items={languages} />
      </div>
    </Reveal>
  );
}
