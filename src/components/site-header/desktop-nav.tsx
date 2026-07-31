import { useTranslations } from "next-intl";

const HREFS = ["#about", "#work", "#experience", "#stack", "#contact"];

export function DesktopNav() {
  const t = useTranslations("Nav");
  const items = t.raw("items") as string[];

  return (
    <nav
      aria-label="Primary"
      className="hidden items-stretch self-stretch lg:ml-auto lg:flex"
    >
      {items.map((label, index) => (
        <a
          key={label}
          href={HREFS[index]}
          className="flex items-center gap-1.5 px-3.5 text-[13.5px] font-medium tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="font-mono text-[9.5px] tracking-[0.06em] text-border">
            0{index + 1}
          </span>
          {label}
        </a>
      ))}
    </nav>
  );
}
