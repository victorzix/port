import { ProjectLedgerRow } from "@/components/projects/project-ledger-row";
import type { ProjectListItem } from "@/server/view-models/project";

interface ProjectLedgerProps {
  projects: ProjectListItem[];
}

export function ProjectLedger({ projects }: ProjectLedgerProps) {
  return (
    <div className="mt-10 flex flex-col sm:mt-16">
      {projects.map((project, index) => (
        <ProjectLedgerRow key={project.slug} project={project} index={index} />
      ))}
    </div>
  );
}
