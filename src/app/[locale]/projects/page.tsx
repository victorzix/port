import { getTranslations } from "next-intl/server";

import { ProjectLedger } from "@/components/projects/project-ledger";
import { ProjectsEmpty } from "@/components/projects/projects-empty";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";
import type { Locale } from "@/i18n/locales";
import { getProjectsForLocale } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  const projects = await getProjectsForLocale(locale as Locale);
  const t = await getTranslations("ProjectsPage");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1080px] overflow-x-clip px-4 pt-10 pb-18 sm:px-16 sm:pt-16 sm:pb-35">
        <section>
          <div className="mb-4.5 flex items-baseline gap-3 sm:mb-6.5">
            <span className="font-mono text-[10px] tracking-[0.12em] text-brand">
              {t("num")}
            </span>
            <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
              {t("label")}
            </span>
          </div>

          <h1 className="max-w-[20ch] text-[28px] leading-[1.04] font-bold tracking-[-0.042em] text-balance text-foreground sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-pretty text-muted-foreground sm:mt-5.5 sm:text-[17px]">
            {t("lead")}
          </p>

          {projects.length === 0 ? (
            <ProjectsEmpty />
          ) : (
            <ProjectLedger projects={projects} />
          )}
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
