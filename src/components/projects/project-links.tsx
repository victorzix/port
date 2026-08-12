import { useTranslations } from "next-intl";

interface ProjectLinksProps {
  repoUrl: string | null;
  liveUrl: string | null;
}

const LINK_CLASS =
  "font-mono text-[11.5px] tracking-[0.08em] text-muted-foreground uppercase transition-colors hover:text-brand";

export function ProjectLinks({ repoUrl, liveUrl }: ProjectLinksProps) {
  const t = useTranslations("ProjectDetail");

  if (!repoUrl && !liveUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {repoUrl && (
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {t("repoLink")} ↗
        </a>
      )}
      {liveUrl && (
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {t("liveLink")} ↗
        </a>
      )}
    </div>
  );
}
