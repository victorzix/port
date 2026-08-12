import { useTranslations } from "next-intl";

import { NAV_ITEMS } from "@/components/site-header/nav-items";
import { Link } from "@/i18n/navigation";

const LINK_CLASS =
  "flex items-center gap-1.5 px-3.5 text-[13.5px] font-medium tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-[0.38]";

export function DesktopNav() {
  const t = useTranslations("Nav");
  const items = t.raw("items") as string[];

  return (
    <nav
      aria-label="Primary"
      className="hidden items-stretch self-stretch lg:ml-auto lg:flex"
    >
      {NAV_ITEMS.map((item, index) => {
        const label = items[index];
        const num = <span className="font-mono text-[9.5px] tracking-[0.06em] text-border">0{index + 1}</span>;

        if (item.kind === "route") {
          return (
            <Link key={item.href} href={item.href} className={LINK_CLASS}>
              {num}
              {label}
            </Link>
          );
        }

        return (
          <a
            key={item.href}
            href={item.href}
            aria-disabled={item.disabled}
            tabIndex={item.disabled ? -1 : undefined}
            className={LINK_CLASS}
          >
            {num}
            {label}
          </a>
        );
      })}
    </nav>
  );
}
