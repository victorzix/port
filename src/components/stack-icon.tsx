import { STACK_ICONS } from "@/lib/stack-icons";

interface StackIconProps {
  name: string;
}

/**
 * Monochrome brand glyph, inlined at render time — no network request and it
 * follows the current text color in both themes. Decorative: the stack label
 * next to it already carries the name.
 */
export function StackIcon({ name }: StackIconProps) {
  const icon = STACK_ICONS[name];
  if (!icon) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 shrink-0 fill-current text-muted-foreground"
    >
      <path d={icon.path} />
    </svg>
  );
}
