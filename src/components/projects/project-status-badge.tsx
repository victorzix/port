import { useTranslations } from "next-intl";

import type { ProjectStatus } from "@/lib/project-enums";
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const t = useTranslations("ProjectsPage");

  return (
    <span
      className={cn(
        "font-mono text-[9.5px] tracking-[0.1em] uppercase",
        status === "active" ? "text-brand" : "text-muted-foreground",
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
