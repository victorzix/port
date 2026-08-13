import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import { ProjectBanner } from "@/components/projects/project-banner";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectLinks } from "@/components/projects/project-links";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ReleaseTimeline } from "@/components/releases/release-timeline";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";
import { MarkdownContent } from "@/components/markdown-content";
import { StackList } from "@/components/stack-list";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/locales";
import { getProjectBySlugForLocale } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getProjectBySlugForLocale(slug, locale as Locale);

  if (!project) return {};

  const ogImage = project.bannerImage?.url ?? project.imageUrl;

  return {
    title: project.name,
    description: project.description.text,
    openGraph: {
      title: project.name,
      description: project.description.text,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { locale, slug } = await params;
  const project = await getProjectBySlugForLocale(slug, locale as Locale);

  if (!project) notFound();

  const t = await getTranslations("ProjectDetail");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1080px] overflow-x-clip px-4 pt-10 pb-18 sm:px-16 sm:pt-16 sm:pb-35">
        <Link
          href="/projects"
          className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-brand"
        >
          ← {t("back")}
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:mt-8">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
              {t("startedIn", { year: project.year })}
            </span>
            <span className="font-mono text-[9.5px] text-muted-foreground">·</span>
            <ProjectStatusBadge status={project.status} />
          </div>

          <h1 className="max-w-[20ch] text-[28px] leading-[1.04] font-bold tracking-[-0.042em] text-balance text-foreground sm:text-5xl">
            {project.name}
          </h1>

          <p className="max-w-[58ch] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-pretty text-muted-foreground sm:text-[17px]">
            {project.description.text}
            {project.description.isFallback && (
              <LocalizedFallbackTag sourceLocale={project.description.sourceLocale} />
            )}
          </p>

          <StackList items={project.stack} />

          <ProjectLinks repoUrl={project.repoUrl} liveUrl={project.liveUrl} />
        </div>

        {project.bannerImage && <ProjectBanner image={project.bannerImage} />}

        {project.summary && (
          <div className="mt-8 max-w-[68ch] sm:mt-11">
            <MarkdownContent content={project.summary.text} />
            {project.summary.isFallback && (
              <LocalizedFallbackTag sourceLocale={project.summary.sourceLocale} />
            )}
          </div>
        )}

        {project.gallery.length > 0 && (
          <ProjectGallery
            images={project.gallery}
            labels={{
              heading: t("galleryHeading"),
              show: t("galleryShow"),
              hide: t("galleryHide"),
              prev: t("galleryPrev"),
              next: t("galleryNext"),
              close: t("galleryClose"),
            }}
          />
        )}

        <section className="mt-11 sm:mt-16">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {t("releasesHeading")}
          </span>
          <ReleaseTimeline releases={project.releases} />
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
