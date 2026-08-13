export type BumpTier = "major" | "minor" | "patch" | "initial";

/**
 * Classifies a release by which version component changed vs. the previous
 * release. Purely positional — index 0 is major, index 1 minor, index >= 2
 * patch. No previous version means the first-ever release ("initial").
 */
export function bumpTier(
  version: string,
  previousVersion: string | null,
): BumpTier {
  if (previousVersion === null) return "initial";

  const current = version.split(".").map(Number);
  const previous = previousVersion.split(".").map(Number);
  const length = Math.max(current.length, previous.length);

  for (let index = 0; index < length; index += 1) {
    const a = current[index] ?? 0;
    const b = previous[index] ?? 0;
    if (a !== b) {
      if (index === 0) return "major";
      if (index === 1) return "minor";
      return "patch";
    }
  }

  return "patch";
}
