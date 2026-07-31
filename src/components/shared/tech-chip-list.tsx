import { cn } from "@/lib/utils";

interface TechChipListProps {
  items: string[];
  size?: "md" | "sm";
}

export function TechChipList({ items, size = "md" }: TechChipListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "inline-flex items-center rounded-lg border border-border bg-muted font-mono tracking-[0.02em] text-foreground",
            size === "md" ? "h-[34px] px-3.5 text-[11.5px]" : "h-[30px] px-2.5 text-[11px]",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
