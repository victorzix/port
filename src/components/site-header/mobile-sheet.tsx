import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";

const HREFS = ["#about", "#work", "#experience", "#stack", "#contact"];

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
        {items.map((label, index) => (
          <a
            key={label}
            href={HREFS[index]}
            onClick={onClose}
            className="flex items-baseline gap-3 py-2.5 text-foreground transition-colors hover:text-brand active:text-brand"
          >
            <span className="w-5 shrink-0 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
              0{index + 1}
            </span>
            <span className="text-3xl leading-[1.06] font-semibold tracking-[-0.045em]">
              {label}
            </span>
          </a>
        ))}
      </div>

      <a
        href="#contact"
        onClick={onClose}
        className="mt-3.5 flex min-h-14 items-center gap-2.5 rounded-full bg-brand px-5.5 text-[15.5px] font-semibold tracking-[-0.02em] text-white"
      >
        {t("cta")}
        <span className="ml-auto text-[15px]">→</span>
      </a>

      <div className="mt-6 flex flex-col gap-2.5 border-t border-border pt-4">
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          {tLocale("label")}
        </span>
        <LocaleSwitcher size="mobile" />
      </div>
    </div>
  );
}
