import { cn } from "@/lib/utils";

interface MobileMenuButtonProps {
  open: boolean;
  onToggle: () => void;
}

export function MobileMenuButton({ open, onToggle }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Menu"
      aria-expanded={open}
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-full transition-colors lg:hidden",
        open && "bg-muted",
      )}
    >
      <span aria-hidden className="relative block h-[13px] w-[19px]">
        <span
          className={cn(
            "absolute top-0 left-0 h-[1.5px] rounded-sm bg-foreground transition-transform duration-[420ms] ease-[cubic-bezier(0.62,0.05,0.01,0.99)]",
            open ? "w-full translate-y-[5.75px] rotate-45" : "w-full",
          )}
        />
        <span
          className={cn(
            "absolute bottom-0 left-0 h-[1.5px] rounded-sm bg-foreground transition-transform duration-[420ms] ease-[cubic-bezier(0.62,0.05,0.01,0.99)]",
            open ? "w-full -translate-y-[5.75px] -rotate-45" : "w-[62%]",
          )}
        />
      </span>
    </button>
  );
}
