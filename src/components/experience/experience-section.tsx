import { useTranslations } from "next-intl";

import { PriorRoleItem } from "@/components/experience/prior-role-item";
import { RoleItem } from "@/components/experience/role-item";

interface Deliverable {
  name: string;
  metric: string;
  note: string;
}

interface Role {
  company: string;
  role: string;
  period: string;
  length: string;
  current?: boolean;
  tag?: string;
  desc: string;
  stack: string[];
  deliverables?: Deliverable[];
  metric?: string;
  metricNote?: string;
}

interface PriorRole {
  company: string;
  role: string;
  period: string;
  desc: string;
}

export function ExperienceSection() {
  const t = useTranslations("Experience");
  const roles = t.raw("roles") as Role[];
  const prior = t.raw("prior") as PriorRole[];

  return (
    <section id="experience" className="mt-16 scroll-mt-28 sm:mt-26">
      <div className="mb-4.5 flex items-baseline gap-3 sm:mb-6.5">
        <span className="font-mono text-[10px] tracking-[0.12em] text-brand">02</span>
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
        {roles.map((role) => (
          <RoleItem key={role.company} role={role} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:mt-13 sm:gap-5.5 sm:pt-7.5">
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          {t("priorLabel")}
        </span>
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 sm:gap-12">
          {prior.map((role) => (
            <PriorRoleItem key={role.company} role={role} />
          ))}
        </div>
      </div>
    </section>
  );
}
