import { DeviceMockup } from "@/components/device-frames/device-mockup";
import type { ResolvedImage } from "@/lib/project-media";
import { cn } from "@/lib/utils";

interface ProjectBannerProps {
  image: ResolvedImage;
}

/** The project's main showcase image, centered in its device mockup. */
export function ProjectBanner({ image }: ProjectBannerProps) {
  const isPhone = image.frame === "iphone" || image.frame === "android";

  return (
    <div className="mt-8 sm:mt-11">
      <div className={cn("mx-auto w-full", isPhone ? "max-w-[260px]" : "max-w-[820px]")}>
        <DeviceMockup image={image} />
      </div>
    </div>
  );
}
