import { getTranslations } from "next-intl/server";

import { ProjectList } from "@/components/projects/project-list";
import { getProjects } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();
  const t = await getTranslations("ProjectsPage");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:px-16 sm:py-32">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ProjectList projects={projects} />
      )}
    </main>
  );
}
