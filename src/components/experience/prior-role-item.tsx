import { Reveal } from "@/components/motion/reveal";

interface PriorRole {
  company: string;
  role: string;
  period: string;
  desc: string;
}

interface PriorRoleItemProps {
  role: PriorRole;
  /** Position in the list — drives the reveal stagger. */
  index?: number;
}

export function PriorRoleItem({ role, index = 0 }: PriorRoleItemProps) {
  return (
    <Reveal delay={(index % 4) * 70} className="flex min-w-0 flex-col gap-1">
      <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
        {role.period}
      </span>
      <span className="text-base font-semibold tracking-[-0.028em] text-foreground">
        {role.company}
      </span>
      <span className="text-[13px] font-medium tracking-[-0.008em] text-muted-foreground">
        {role.role}
      </span>
      <span className="mt-0.5 max-w-[42ch] text-[13px] leading-[1.55] text-pretty text-muted-foreground">
        {role.desc}
      </span>
    </Reveal>
  );
}
