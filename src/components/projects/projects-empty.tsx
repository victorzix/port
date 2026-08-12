import { useTranslations } from "next-intl";

export function ProjectsEmpty() {
  const t = useTranslations("ProjectsPage");

  return (
    <div className="mt-10 flex flex-col border-t border-border pt-6 sm:mt-16 sm:pt-7.5">
      <span className="font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground uppercase">
        {t("empty.meta")}
      </span>
      <p className="text-xl leading-[1.1] font-semibold tracking-[-0.036em] text-balance text-foreground sm:text-[27px]">
        {t("empty.title")}
      </p>
      <p className="mt-3 max-w-[52ch] text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-muted-foreground sm:text-[15.5px]">
        {t("empty.body")}
      </p>
    </div>
  );
}
