import { useTranslations } from "next-intl";

interface ProjectLinksProps {
  repoUrl: string | null;
  liveUrl: string | null;
}

export function ProjectLinks({ repoUrl, liveUrl }: ProjectLinksProps) {
  const t = useTranslations("ProjectDetail");

  if (!repoUrl && !liveUrl) return null;

  return (
    <div className="flex flex-wrap gap-3 text-sm font-medium">
      {repoUrl && (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
        >
          {t("repoLink")}
        </a>
      )}
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
        >
          {t("liveLink")}
        </a>
      )}
    </div>
  );
}
