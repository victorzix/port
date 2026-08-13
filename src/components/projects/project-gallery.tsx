"use client";

import { type CSSProperties, useCallback, useEffect, useState } from "react";

import { DeviceMockup } from "@/components/device-frames/device-mockup";
import { GalleryLightbox } from "@/components/projects/gallery-lightbox";
import type { ResolvedImage } from "@/lib/project-media";
import { cn } from "@/lib/utils";

export interface GalleryLabels {
  heading: string;
  show: string;
  hide: string;
  prev: string;
  next: string;
  close: string;
}

interface ProjectGalleryProps {
  images: ResolvedImage[];
  labels: GalleryLabels;
}

/** Phones are tall and browsers are wide — pick widths that land on a similar
 * height so the marquee row reads as one strip. */
function itemWidth(frame: ResolvedImage["frame"]): string {
  return frame === "iphone" || frame === "android"
    ? "w-[94px] sm:w-[138px]"
    : "w-[300px] sm:w-[448px]";
}

export function ProjectGallery({ images, labels }: ProjectGalleryProps) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const go = useCallback(
    (direction: number) =>
      setActive((current) =>
        current === null
          ? current
          : (current + direction + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (active === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, close, go]);

  if (images.length === 0) return null;

  // Duplicated once so the marquee can loop seamlessly at translateX(-50%).
  const track = [...images, ...images];

  return (
    <section className="mt-11 sm:mt-16">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-brand"
      >
        <span>{labels.heading}</span>
        <span aria-hidden="true" className="text-brand">
          {images.length}
        </span>
        <span
          aria-hidden="true"
          className={cn("text-[11px] transition-transform", open && "rotate-90")}
        >
          ›
        </span>
        <span className="sr-only">{open ? labels.hide : labels.show}</span>
      </button>

      {open && (
        <div className="dc-marquee-viewport group relative mt-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-12" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-12" />

          <div
            className="dc-marquee flex w-max items-center gap-5 group-hover:[animation-play-state:paused]"
            style={{ "--dc-duration": `${Math.max(images.length * 6, 18)}s` } as CSSProperties}
          >
            {track.map((image, index) => {
              const isClone = index >= images.length;
              return (
                <button
                  key={index}
                  type="button"
                  aria-hidden={isClone}
                  tabIndex={isClone ? -1 : 0}
                  onClick={() => setActive(index % images.length)}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-lg transition-opacity hover:opacity-90 focus-visible:opacity-100",
                    itemWidth(image.frame),
                  )}
                >
                  <DeviceMockup image={image} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {active !== null && (
        <GalleryLightbox
          image={images[active]}
          labels={labels}
          hasMany={images.length > 1}
          onClose={close}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
        />
      )}
    </section>
  );
}
