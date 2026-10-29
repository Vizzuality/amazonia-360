export const CATALOGUE_SLUGS = ["topics", "subtopics", "indicators"] as const;

export const isCatalogueSlug = (slug: unknown) =>
  typeof slug === "string" && (CATALOGUE_SLUGS as readonly string[]).includes(slug);
