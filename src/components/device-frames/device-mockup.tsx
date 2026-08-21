import { Android } from "@/components/device-frames/android";
import { Iphone } from "@/components/device-frames/iphone";
import { Safari } from "@/components/device-frames/safari";
import type { ResolvedImage } from "@/lib/project-media";
import { cn } from "@/lib/utils";

interface DeviceMockupProps {
  image: ResolvedImage;
  className?: string;
}

/** Renders an image/video inside the device frame named by `image.frame`. */
export function DeviceMockup({ image, className }: DeviceMockupProps) {
  const alt = image.alt ?? "";
  const videoSrc = image.videoUrl ?? undefined;

  switch (image.frame) {
    case "iphone":
      return (
        <Iphone src={image.url} videoSrc={videoSrc} imageAlt={alt} className={className} />
      );
    case "android":
      return (
        <Android src={image.url} videoSrc={videoSrc} imageAlt={alt} className={className} />
      );
    case "browser":
      return (
        <Safari
          imageSrc={image.url}
          videoSrc={videoSrc}
          imageAlt={alt}
          url={image.browserUrl ?? undefined}
          className={className}
        />
      );
    default:
      return (
        <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
          {videoSrc ? (
            <video
              className="block w-full"
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img className="block w-full" src={image.url} alt={alt} />
          )}
        </div>
      );
  }
}
