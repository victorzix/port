"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import type { ResolvedImage } from "@/lib/project-media";
import { cn } from "@/lib/utils";

interface MediaLightboxProps {
  image: ResolvedImage;
  onClose: () => void;
  /** Provided by the gallery for multi-image navigation. */
  onPrev?: () => void;
  onNext?: () => void;
  hasMany?: boolean;
}

const CONTROL =
  "flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:bg-white/25";

/**
 * Full-screen viewer showing the image/video **uncropped** (object-contain) so a
 * screenshot is readable without zooming. Owns keyboard (Esc / arrows) and body
 * scroll-lock while open. Reads its own labels from ProjectDetail.
 */
export function MediaLightbox({
  image,
  onClose,
  onPrev,
  onNext,
  hasMany = false,
}: MediaLightboxProps) {
  const t = useTranslations("ProjectDetail");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") onPrev?.();
      else if (event.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", onKey);

    // Lock scroll without the layout shifting right: replace the vanishing
    // scrollbar with equivalent padding while the overlay is open.
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 p-4 backdrop-blur-sm duration-200 animate-in fade-in-0 motion-reduce:animate-none sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("galleryClose")}
        className={cn(CONTROL, "absolute top-4 right-4")}
      >
        ✕
      </button>

      <figure
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full max-w-[1100px] flex-col items-center gap-4 duration-300 ease-out animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none"
      >
        {image.videoUrl ? (
          <video
            className="max-h-[82vh] w-auto max-w-full rounded-lg"
            src={image.videoUrl}
            controls
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img
            src={image.url}
            alt={image.alt ?? ""}
            className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
          />
        )}
        {image.caption && (
          <figcaption className="text-center text-[13px] leading-[1.5] text-white/80">
            {image.caption.text}
            {image.caption.isFallback && (
              <LocalizedFallbackTag sourceLocale={image.caption.sourceLocale} />
            )}
          </figcaption>
        )}
      </figure>

      {hasMany && (
        <div
          className="flex items-center gap-4"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onPrev}
            aria-label={t("galleryPrev")}
            className={CONTROL}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={t("galleryNext")}
            className={CONTROL}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
