import { useTranslations } from "next-intl";

import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import { Reveal } from "@/components/motion/reveal";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { StackList } from "@/components/stack-list";
import { Link } from "@/i18n/navigation";
import type { ProjectListItem } from "@/server/view-models/project";

interface ProjectLedgerRowProps {
  project: ProjectListItem;
  /** Position in the ledger — drives the reveal stagger. */
  index?: number;
}

export function ProjectLedgerRow({ project, index = 0 }: ProjectLedgerRowProps) {
  const t = useTranslations("ProjectsPage");

  return (
    <Reveal as="article" delay={(index % 4) * 70} className="border-t border-border">
      <Link
        href={`/projects/${project.slug}`}
        className="group grid grid-cols-1 gap-3.5 py-6 sm:grid-cols-[1fr_184px] sm:gap-x-10 sm:py-8"
      >
        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
                {project.year}
              </span>
              <span className="font-mono text-[9.5px] text-muted-foreground">·</span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <h2 className="text-xl leading-[1.1] font-semibold tracking-[-0.036em] text-balance text-foreground transition-colors group-hover:text-brand sm:text-[27px]">
              {project.name}
            </h2>
          </div>
          <p className="max-w-[74ch] text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-muted-foreground sm:text-[15.5px]">
            {project.description.text}
            {project.description.isFallback && (
              <LocalizedFallbackTag sourceLocale={project.description.sourceLocale} />
            )}
          </p>
          <StackList items={project.stack} />
        </div>

        <div className="flex flex-row items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
          {project.latestVersion && (
            <span className="font-mono text-[13px] tracking-[0.02em] text-brand">
              v{project.latestVersion}
            </span>
          )}
          <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
            {t("releaseCount", { count: project.releaseCount })}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
