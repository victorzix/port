import type { BumpTier } from "@/lib/version-bump";

/** Text color per tier — shared by the tag, the version number, and the index. */
export const TIER_TEXT_COLOR: Record<BumpTier, string> = {
  major: "text-brand",
  initial: "text-brand",
  minor: "text-foreground",
  patch: "text-muted-foreground",
};

/** Version-number scale/weight per tier, layered on top of the color. */
export const TIER_VERSION_STYLE: Record<BumpTier, string> = {
  major: "text-[19px] font-bold sm:text-[22px]",
  initial: "text-[19px] font-bold sm:text-[22px]",
  minor: "text-[15px] font-semibold",
  patch: "text-[14px] font-medium",
};
