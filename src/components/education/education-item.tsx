import { Reveal } from "@/components/motion/reveal";

interface Education {
  period: string;
  course: string;
  institution: string;
}

interface EducationItemProps {
  education: Education;
  /** Position in the list — drives the reveal stagger. */
  index?: number;
}

export function EducationItem({ education, index = 0 }: EducationItemProps) {
  return (
    <Reveal
      delay={(index % 4) * 70}
      className="flex flex-col gap-1 border-t border-border py-4"
    >
      <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
        {education.period}
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.028em] text-foreground">
        {education.course}
      </span>
      <span className="text-[13px] font-medium tracking-[-0.008em] text-muted-foreground">
        {education.institution}
      </span>
    </Reveal>
  );
}
