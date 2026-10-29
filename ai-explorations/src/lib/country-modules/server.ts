import "@tanstack/react-start/server-only";

import { getPayload } from "payload";

import config from "@/payload.config";

export async function getActiveModuleSlugs(): Promise<string[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "country-modules",
    where: { active: { equals: true } },
    select: { slug: true },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });

  return docs.map(({ slug }) => slug);
}
