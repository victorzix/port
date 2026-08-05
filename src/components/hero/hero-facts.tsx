import { NumberTicker } from "@/components/motion/number-ticker";
import { Reveal } from "@/components/motion/reveal";

interface Fact {
  label: string;
  value: string;
  note: string;
}

interface HeroFactsProps {
  facts: Fact[];
}

export function HeroFacts({ facts }: HeroFactsProps) {
  return (
    <div className="mt-11 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-border pt-6 sm:mt-16 sm:grid-cols-2 sm:pt-8">
      {facts.map((fact, index) => (
        <Reveal
          key={`${fact.label}-${index}`}
          delay={(index % 4) * 70}
          className="flex min-w-0 flex-col gap-2"
        >
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {fact.label}
          </span>
          <NumberTicker
            value={fact.value}
            className="text-xl font-semibold tracking-[-0.035em] text-foreground tabular-nums sm:text-2xl"
          />
          <span className="text-[13.5px] leading-relaxed text-muted-foreground">{fact.note}</span>
        </Reveal>
      ))}
    </div>
  );
}
