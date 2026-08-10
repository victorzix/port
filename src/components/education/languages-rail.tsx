interface Language {
  name: string;
  level: string;
}

interface LanguagesRailProps {
  label: string;
  items: Language[];
}

/** Narrow right-hand rail, mirrors AboutMethod's measure and divider rhythm. */
export function LanguagesRail({ label, items }: LanguagesRailProps) {
  return (
    <div className="flex flex-col">
      <span className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-baseline justify-between gap-3 border-t border-border py-2.5"
        >
          <span className="text-[13.5px] font-medium tracking-[-0.008em] text-foreground">
            {item.name}
          </span>
          <span className="font-mono text-[11px] tracking-[0.04em] whitespace-nowrap text-muted-foreground">
            {item.level}
          </span>
        </div>
      ))}
    </div>
  );
}
