interface AboutMethodProps {
  label: string;
  items: string[];
}

/**
 * Narrow right-hand rail. Shares the 184px measure and the divider rhythm of
 * the experience rows, so the About block reads as part of the same system.
 */
export function AboutMethod({ label, items }: AboutMethodProps) {
  return (
    <div className="flex flex-col">
      <span className="mb-2 font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      {items.map((item) => (
        <span
          key={item}
          className="border-t border-border py-2.5 text-[12.5px] leading-[1.4] tracking-[-0.008em] text-pretty text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
