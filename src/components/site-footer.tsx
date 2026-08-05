import { useTranslations } from "next-intl";

import { Reveal } from "@/components/motion/reveal";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <Reveal
      as="footer"
      className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase sm:mt-16"
    >
      <span>Victor Raphael · Full Stack Dev</span>
      <span className="ml-auto">{t("updated")}</span>
    </Reveal>
  );
}
