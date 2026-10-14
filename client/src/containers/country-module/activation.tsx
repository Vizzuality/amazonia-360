"use client";

import { useEffect, useMemo, useRef } from "react";

import { useSearchParams } from "next/navigation";

import { isUnscopedPathname, withCountry } from "@/lib/country";
import {
  getCountryCoverageRatio,
  isCountryCoverageDominant,
  useGetLiveCountryBoundaries,
} from "@/lib/country/coverage";
import { useGetActiveModuleSlugs, useGetCountryModules } from "@/lib/country-modules";
import { useLocationGeometry } from "@/lib/location";

import { Location } from "@/app/(frontend)/parsers";
import { useSyncLocation } from "@/app/(frontend)/store";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

export default function CountryModuleActivation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const country = useCountry();
  const modules = useGetCountryModules();
  const liveSlugs = useGetActiveModuleSlugs();
  const [location] = useSyncLocation();
  const geometry = useLocationGeometry(location);

  const eligible = country === null && !isUnscopedPathname(pathname);

  const { data: boundaries } = useGetLiveCountryBoundaries(modules, { enabled: eligible });

  // Overlapping modules are possible once a second country is live, so the area's own
  // dominant module is the one it covers most, not the first one declared.
  const targetSlug = useMemo(() => {
    if (!eligible || !boundaries) return null;

    const [best] = boundaries
      .map((entry) => ({
        slug: entry.slug,
        ratio: getCountryCoverageRatio(geometry, entry.geometry),
      }))
      .filter((entry) => isCountryCoverageDominant(entry.ratio))
      .sort((a, b) => b.ratio - a.ratio);

    return best?.slug ?? null;
  }, [eligible, boundaries, geometry]);

  const queryString = searchParams?.toString() ?? "";

  const activatedLocation = useRef<Location | null | undefined>(undefined);

  useEffect(() => {
    if (!location || isUnscopedPathname(pathname)) return;

    // Leaving the module puts `country` back to null, which would re-satisfy the gate on the
    // next render — so a module is offered once per drawn area, not held as a standing rule.
    if (country !== null || activatedLocation.current === location) {
      activatedLocation.current = location;
      return;
    }

    if (!targetSlug) return;
    activatedLocation.current = location;
    const query = Object.fromEntries(new URLSearchParams(queryString).entries());
    router.replace({ pathname: withCountry(pathname, targetSlug, liveSlugs), query });
  }, [targetSlug, location, country, pathname, queryString, router, liveSlugs]);

  return null;
}
