import type { Locale } from "@/i18n/locales";
import { resolve, type Localized, type Resolved } from "@/lib/localized";

/** Which device mockup wraps an image. Absent = plain framed image. */
export const DEVICE_FRAMES = ["browser", "iphone", "android"] as const;
export type DeviceFrame = (typeof DEVICE_FRAMES)[number];

/**
 * A screenshot (or short video) shown somewhere on a project — as the banner,
 * a gallery item, or attached to a single release change. Everything but `url`
 * is optional, so content can be added progressively.
 */
export interface ProjectImage {
  /** The image URL. Ignored when `videoUrl` is set. */
  url: string;
  /** Device mockup to render it inside. Omit for a plain framed image. */
  frame?: DeviceFrame;
  /** When set, the frame plays this looping video instead of the image. */
  videoUrl?: string;
  /** Accessibility text — localized, not rendered visibly. */
  alt?: Localized;
  /** Visible caption, shown under the image in the gallery lightbox. */
  caption?: Localized;
  /** Address-bar text for the `browser` frame (e.g. "docobra.app"). */
  browserUrl?: string;
}

/** A `ProjectImage` with its localized fields resolved for one locale. */
export interface ResolvedImage {
  url: string;
  frame: DeviceFrame | null;
  videoUrl: string | null;
  alt: string | null;
  caption: Resolved | null;
  browserUrl: string | null;
}

export function resolveImage(image: ProjectImage, locale: Locale): ResolvedImage {
  return {
    url: image.url,
    frame: image.frame ?? null,
    videoUrl: image.videoUrl ?? null,
    alt: image.alt ? resolve(image.alt, locale).text : null,
    caption: image.caption ? resolve(image.caption, locale) : null,
    browserUrl: image.browserUrl ?? null,
  };
}
