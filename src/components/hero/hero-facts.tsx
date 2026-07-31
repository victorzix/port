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
    <div className="mt-11 grid grid-cols-1 gap-6 border-t border-border pt-6 sm:mt-16 sm:grid-cols-3 sm:gap-10 sm:pt-8">
      {facts.map((fact) => (
        <div key={fact.label} className="flex min-w-0 flex-col gap-2">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {fact.label}
          </span>
          <span className="text-xl font-semibold tracking-[-0.035em] text-foreground sm:text-2xl">
            {fact.value}
          </span>
          <span className="text-[13.5px] leading-relaxed text-muted-foreground">
            {fact.note}
          </span>
        </div>
      ))}
    </div>
  );
}
