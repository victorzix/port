"use client";

import { DeviceMockup } from "@/components/device-frames/device-mockup";
import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import type { ResolvedImage } from "@/lib/project-media";
import { cn } from "@/lib/utils";

interface GalleryLightboxProps {
  image: ResolvedImage;
  labels: { prev: string; next: string; close: string };
  hasMany: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const CONTROL =
  "flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:bg-white/25";

export function GalleryLightbox({
  image,
  labels,
  hasMany,
  onClose,
  onPrev,
  onNext,
}: GalleryLightboxProps) {
  const isPhone = image.frame === "iphone" || image.frame === "android";

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/80 p-4 backdrop-blur-sm sm:p-10"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className={cn(CONTROL, "absolute top-4 right-4")}
      >
        ✕
      </button>

      <div
        onClick={(event) => event.stopPropagation()}
        className={cn("w-full", isPhone ? "max-w-[300px]" : "max-w-[900px]")}
      >
        <DeviceMockup image={image} />
        {image.caption && (
          <p className="mt-4 text-center text-[13px] leading-[1.5] text-white/80">
            {image.caption.text}
            {image.caption.isFallback && (
              <LocalizedFallbackTag sourceLocale={image.caption.sourceLocale} />
            )}
          </p>
        )}
      </div>

      {hasMany && (
        <div className="flex items-center gap-4" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={onPrev} aria-label={labels.prev} className={CONTROL}>
            ‹
          </button>
          <button type="button" onClick={onNext} aria-label={labels.next} className={CONTROL}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}
