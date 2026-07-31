import { useTranslations } from "next-intl";

import { WorkProjectCard } from "@/components/work/work-project-card";

interface Project {
  name: string;
  context: string;
  metric: string;
  desc: string;
  stack: string[];
}

export function WorkSection() {
  const t = useTranslations("Work");
  const projects = t.raw("projects") as Project[];

  return (
    <section id="work" className="mt-22 scroll-mt-28 sm:mt-40">
      <div className="mb-4.5 flex items-baseline gap-3 sm:mb-6.5">
        <span className="font-mono text-[10px] tracking-[0.12em] text-brand">
          02
        </span>
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          {t("label")}
        </span>
      </div>

      <h2 className="max-w-[20ch] text-[28px] leading-[1.04] font-bold tracking-[-0.042em] text-balance text-foreground sm:text-5xl">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-[58ch] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-pretty text-muted-foreground sm:mt-5.5 sm:text-[17px]">
        {t("lead")}
      </p>

      <div className="mt-10 flex flex-col sm:mt-16">
        {projects.map((project, index) => (
          <WorkProjectCard
            key={project.name}
            project={project}
            index={index}
            impactLabel={t("impactLabel")}
            stackLabel={t("stackLabel")}
          />
        ))}
      </div>
    </section>
  );
}
