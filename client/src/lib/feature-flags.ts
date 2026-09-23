/**
 * Features that ship in the build but are not ready to be seen.
 *
 * The registry is a union rather than a free string, so a typo at a call site is a type
 * error instead of a flag that is silently always off.
 */
export const FEATURE_FLAGS = ["country-module"] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

/** `"a, b ,,c"` is three flags; empty, blank and unset are all none. */
export function parseFeatureFlags(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((flag) => flag.trim())
    .filter(Boolean);
}

/**
 * Read per call rather than parsed once at module load. Next inlines the literal
 * `process.env.NEXT_PUBLIC_FEATURE_FLAGS` at build time, so a real build pays nothing for
 * this, and it keeps the flags stubbable in tests without resetting modules.
 *
 * Deliberately not routed through `env.mjs`: that module snapshots `process.env` when it is
 * first imported, which would freeze the flags before a test could set them.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return parseFeatureFlags(process.env.NEXT_PUBLIC_FEATURE_FLAGS).includes(flag);
}
