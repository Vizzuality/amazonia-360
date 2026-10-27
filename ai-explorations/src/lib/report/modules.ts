import type { CountryModule } from "@/lib/country-modules";

import type { Report } from "@/payload-types";

export function getReportModuleIds(entries: Report["modules"]): string[] {
  return (entries ?? []).map((entry) => (typeof entry === "string" ? entry : entry.id));
}

// A module the reader can't see comes back as a bare id, and an id outside the active list
// has no slug: it is dropped rather than guessed.
export function getReportModuleSlugs(
  entries: Report["modules"],
  modules: readonly CountryModule[],
): string[] {
  return getReportModuleIds(entries).flatMap((id) => {
    const slug = modules.find((candidate) => candidate.id === id)?.slug;
    return slug ? [slug] : [];
  });
}
