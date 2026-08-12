import { StackIcon } from "@/components/stack-icon";

interface StackListProps {
  items: string[];
}

/**
 * Stack labels with their monochrome brand glyphs. Shared by the experience
 * timeline, the projects ledger and the project detail header so the three
 * stay visually identical.
 */
export function StackList({ items }: StackListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-[7px] font-mono text-[11.5px] tracking-[0.01em] text-foreground"
        >
          <StackIcon name={item} />
          {item}
        </span>
      ))}
    </div>
  );
}
