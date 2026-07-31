import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { ProjectLinks } from "@/components/projects/project-links";
import { ChangelogTimeline } from "@/components/changelog/changelog-timeline";
import { getProjectBySlug } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const t = await getTranslations("ProjectDetail");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:px-16 sm:py-32">
      <Link
        href="/projects"
        className="text-sm text-muted-foreground hover:underline"
      >
        {t("backToProjects")}
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {project.name}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {project.description}
        </p>
        <ProjectLinks repoUrl={project.repoUrl} liveUrl={project.liveUrl} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold sm:text-xl">
          {t("changelogHeading")}
        </h2>
        <ChangelogTimeline entries={project.changelogEntries} />
      </div>
    </main>
  );
}
