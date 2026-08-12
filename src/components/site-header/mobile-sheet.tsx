import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { NAV_ITEMS } from "@/components/site-header/nav-items";
import { Link } from "@/i18n/navigation";

const ITEM_CLASS =
  "flex items-baseline gap-3 py-2.5 text-foreground transition-colors hover:text-brand active:text-brand aria-disabled:pointer-events-none aria-disabled:opacity-[0.38]";

interface MobileSheetProps {
  onClose: () => void;
}

export function MobileSheet({ onClose }: MobileSheetProps) {
  const t = useTranslations("Nav");
  const tLocale = useTranslations("LocaleSwitcher");
  const items = t.raw("items") as string[];

  return (
    <div className="flex max-h-[calc(100dvh-130px)] animate-in fade-in flex-col overflow-y-auto border-t border-border bg-background px-4 pt-1.5 pb-[calc(26px+env(safe-area-inset-bottom))] duration-300 sm:px-16">
      <div className="flex flex-col py-4">
        {NAV_ITEMS.map((item, index) => {
          const label = items[index];
          const body = (
            <>
              <span className="w-5 shrink-0 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
                0{index + 1}
              </span>
              <span className="text-3xl leading-[1.06] font-semibold tracking-[-0.045em]">
                {label}
              </span>
            </>
          );

          // Anchors are root-relative so they resolve from any route
          // (next-intl then localizes the path portion and keeps the hash).
          const href = item.kind === "anchor" ? `/${item.href}` : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              onClick={item.disabled ? undefined : onClose}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : undefined}
              className={ITEM_CLASS}
            >
              {body}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-2.5 border-t border-border pt-4">
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          {tLocale("label")}
        </span>
        <LocaleSwitcher size="mobile" />
      </div>
    </div>
  );
}
