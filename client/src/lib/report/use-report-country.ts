"use client";

import { useParams } from "next/navigation";

import { useGetCountryModules } from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useReport } from "@/lib/report";
import { getReportModuleSlugs } from "@/lib/report/modules";

// Reads the report's own stored modules rather than the URL's: a report can be opened
// unscoped (viewer, webshot) yet must still resolve indicators from the module it was saved in.
export const useReportCountry = (): readonly string[] | null => {
  const { id } = useParams();
  const { data } = useReport({ id: `${id}` });
  const modules = useGetCountryModules();
  if (!isFeatureEnabled("country-module")) return null;
  const slugs = getReportModuleSlugs(data?.modules, modules);
  return slugs.length ? slugs : null;
};
