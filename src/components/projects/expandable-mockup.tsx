"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { DeviceMockup } from "@/components/device-frames/device-mockup";
import { MediaLightbox } from "@/components/projects/media-lightbox";
import type { ResolvedImage } from "@/lib/project-media";
import { cn } from "@/lib/utils";

interface ExpandableMockupProps {
  image: ResolvedImage;
  /** Sizing for the inline thumbnail (e.g. max-width). */
  className?: string;
}

/** Inline device-framed thumbnail that opens the image full-size on click. */
export function ExpandableMockup({ image, className }: ExpandableMockupProps) {
  const t = useTranslations("ProjectDetail");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("mediaExpand")}
        className={cn(
          "block w-full cursor-zoom-in rounded-lg transition-opacity hover:opacity-90 focus-visible:opacity-100",
          className,
        )}
      >
        <DeviceMockup image={image} />
      </button>
      {open && <MediaLightbox image={image} onClose={() => setOpen(false)} />}
    </>
  );
}
