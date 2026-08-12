import { NumberTicker } from "@/components/motion/number-ticker";
import { Reveal } from "@/components/motion/reveal";
import { StackList } from "@/components/stack-list";
import { cn } from "@/lib/utils";

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

interface RoleItemProps {
  role: Role;
  /** Position in the timeline — drives the reveal stagger. */
  index?: number;
}

export function RoleItem({ role, index = 0 }: RoleItemProps) {
  const hasMetric = Boolean(role.metric);
  const hasDeliverables = Boolean(role.deliverables?.length);

  return (
    <Reveal
      as="article"
      delay={(index % 4) * 70}
      className="grid grid-cols-1 gap-3.5 border-t border-border py-6 sm:grid-cols-[1fr_184px] sm:gap-x-10 sm:py-8"
    >
      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-[10.5px] tracking-[0.08em]",
                role.current ? "text-brand" : "text-muted-foreground",
              )}
            >
              {role.period}
            </span>
            {role.tag && (
              <span className="font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground uppercase">
                · {role.tag}
              </span>
            )}
          </div>
          <h3 className="text-xl leading-[1.1] font-semibold tracking-[-0.036em] text-balance text-foreground sm:text-[27px]">
            {role.company}
          </h3>
          <span className="text-[13.5px] font-medium tracking-[-0.01em] text-muted-foreground">
            {role.role}
          </span>
        </div>
        <p className="max-w-[74ch] text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-muted-foreground sm:text-[15.5px]">
          {role.desc}
        </p>
        <StackList items={role.stack} />
        {hasMetric && (
          <div className="flex flex-wrap items-baseline gap-2.5 sm:hidden">
            <NumberTicker
              value={role.metric!}
              className="text-3xl font-bold tracking-[-0.045em] text-brand tabular-nums"
            />
            <span className="text-[13px] whitespace-nowrap text-muted-foreground">
              {role.metricNote}
            </span>
          </div>
        )}
      </div>

      {hasDeliverables && (
        <div className="col-span-full flex flex-col">
          {role.deliverables!.map((d) => (
            <div
              key={d.name}
              className="grid grid-cols-1 gap-y-1.5 border-t border-border py-3 sm:grid-cols-[1fr_184px] sm:items-baseline sm:gap-x-10"
            >
              <span className="text-[15.5px] font-semibold tracking-[-0.024em] text-foreground">
                {d.name}
              </span>
              <NumberTicker
                value={d.metric}
                className="font-mono text-[12.5px] tracking-[0.02em] whitespace-nowrap text-brand tabular-nums sm:justify-self-end"
              />
              <span className="max-w-[74ch] text-[13.5px] leading-[1.55] tracking-[-0.006em] text-pretty text-muted-foreground sm:col-start-1">
                {d.note}
              </span>
            </div>
          ))}
        </div>
      )}

      <aside className="hidden flex-col items-end pt-1 text-right sm:col-start-2 sm:row-start-1 sm:flex">
        <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
          {role.length}
        </span>
        {hasMetric && (
          <div className="mt-1 flex flex-col items-end gap-1">
            <NumberTicker
              value={role.metric!}
              className="text-[32px] leading-[0.95] font-bold tracking-[-0.05em] text-brand tabular-nums"
            />
            <span className="max-w-[16ch] text-[12.5px] leading-[1.4] tracking-[-0.008em] text-muted-foreground">
              {role.metricNote}
            </span>
          </div>
        )}
      </aside>
    </Reveal>
  );
}
