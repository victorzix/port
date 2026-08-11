/** Dot-separated integers, no leading "v", no pre-release suffix. */
const VERSION_PATTERN = /^\d+(?:\.\d+)*$/;
const COMPONENT_WIDTH = 5;

export class InvalidVersionError extends Error {
  constructor(version: string) {
    super(
      `Version "${version}" must be dot-separated integers of at most ${COMPONENT_WIDTH} digits, with no leading "v"`,
    );
    this.name = "InvalidVersionError";
  }
}

export function isValidVersion(version: string): boolean {
  if (!VERSION_PATTERN.test(version)) return false;
  return version.split(".").every((part) => part.length <= COMPONENT_WIDTH);
}

/**
 * Zero-pads each component so string ordering matches numeric ordering:
 * "1.10.0" → "00001.00010.00000" sorts above "1.9.0" → "00001.00009.00000".
 */
export function toVersionKey(version: string): string {
  if (!isValidVersion(version)) throw new InvalidVersionError(version);

  return version
    .split(".")
    .map((part) => part.padStart(COMPONENT_WIDTH, "0"))
    .join(".");
}

/** Deep-link anchor for one release: "1.4.0" → "v1-4-0". */
export function versionAnchor(version: string): string {
  return `v${version.replaceAll(".", "-")}`;
}
