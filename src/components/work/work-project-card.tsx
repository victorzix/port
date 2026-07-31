import { TechChipList } from "@/components/shared/tech-chip-list";

interface Project {
  name: string;
  context: string;
  metric: string;
  desc: string;
  stack: string[];
}

interface WorkProjectCardProps {
  project: Project;
  index: number;
  impactLabel: string;
  stackLabel: string;
}

export function WorkProjectCard({
  project,
  index,
  impactLabel,
  stackLabel,
}: WorkProjectCardProps) {
  return (
    <article className="grid grid-cols-1 gap-6 border-t border-border py-8 sm:grid-cols-2 sm:gap-10 sm:py-10">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
            0{index + 1}
          </span>
          <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
            {project.context}
          </span>
        </div>
        <h3 className="text-2xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance text-foreground sm:text-[34px]">
          {project.name}
        </h3>
        <p className="mt-1 max-w-[54ch] text-sm leading-[1.6] tracking-[-0.006em] text-pretty text-muted-foreground sm:text-[15.5px]">
          {project.desc}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-5 sm:gap-7">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {impactLabel}
          </span>
          <span className="text-3xl font-bold tracking-[-0.05em] text-brand tabular-nums sm:text-[44px]">
            {project.metric}
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {stackLabel}
          </span>
          <TechChipList items={project.stack} size="sm" />
        </div>
      </div>
    </article>
  );
}
