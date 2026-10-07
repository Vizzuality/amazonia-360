"use client";

import * as geodeticAreaOperator from "@arcgis/core/geometry/operators/geodeticAreaOperator";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { CountryModule } from "@/lib/country-modules";
import { getFeatures } from "@/lib/query";
import { omit } from "@/lib/utils";

import { COUNTRIES } from "@/constants/countries";
import { DATASETS } from "@/constants/datasets";

export const COUNTRY_COVERAGE_ACTIVATION_THRESHOLD = 0.5;

const isCountryIso3 = (value: string): boolean => COUNTRIES.some((entry) => entry.iso3 === value);

// The module boundary is admin0[GID_0=iso3] ∩ area_afp: delivered indicators are clipped
// to that intersection, not to the country alone.
export const getCountryAmazoniaBoundary = async (
  iso3: string,
): Promise<__esri.GeometryUnion | null> => {
  if (!isCountryIso3(iso3)) return null;

  const [country, amazonia] = await Promise.all([
    getFeatures({
      feature: DATASETS.admin0.layer,
      query: DATASETS.admin0.getFeatures({
        where: `GID_0 = '${iso3}'`,
        outFields: ["GID_0"],
        returnGeometry: true,
      }),
    }),
    getFeatures({
      feature: omit(DATASETS.area_afp.layer, ["renderer"]),
      query: DATASETS.area_afp.getFeatures({ returnGeometry: true }),
    }),
  ]);

  const countryGeometry = country.features[0]?.geometry;
  const amazoniaGeometry = amazonia.features[0]?.geometry;

  if (!countryGeometry || !amazoniaGeometry) return null;

  return intersectionOperator.execute(countryGeometry, amazoniaGeometry) ?? null;
};

export const getCountryAmazoniaBoundaryKey = (iso3: string) =>
  ["country-coverage", "boundary", iso3] as const;

export type CountryAmazoniaBoundaryQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>,
  TError,
  TData
>;

export const getCountryAmazoniaBoundaryOptions = <
  TData = Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>,
  TError = unknown,
>(
  iso3: string,
  options?: Omit<CountryAmazoniaBoundaryQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getCountryAmazoniaBoundaryKey(iso3);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>> = () =>
    getCountryAmazoniaBoundary(iso3);

  return {
    queryKey,
    queryFn,
    enabled: isCountryIso3(iso3),
    staleTime: Infinity,
    ...options,
  } as CountryAmazoniaBoundaryQueryOptions<TData, TError>;
};

export const useGetCountryAmazoniaBoundary = <
  TData = Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>,
  TError = unknown,
>(
  iso3: string,
  options?: Omit<CountryAmazoniaBoundaryQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn, enabled, staleTime } = getCountryAmazoniaBoundaryOptions(
    iso3,
    options,
  );

  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    ...options,
  });
};

export type CountryBoundary = {
  slug: string;
  country: string;
  geometry: __esri.GeometryUnion;
};

// One round trip for every live module: `area_afp` is a single large polygon and fetching it
// once per country would refetch it verbatim N times.
export const getLiveCountryBoundaries = async (
  modules: readonly CountryModule[],
): Promise<CountryBoundary[]> => {
  const countries = [...new Set(modules.map((module) => module.country))].filter(isCountryIso3);
  if (countries.length === 0) return [];

  const [admin0, amazonia] = await Promise.all([
    getFeatures({
      feature: DATASETS.admin0.layer,
      query: DATASETS.admin0.getFeatures({
        where: `GID_0 IN (${countries.map((iso3) => `'${iso3}'`).join(", ")})`,
        outFields: ["GID_0"],
        returnGeometry: true,
      }),
    }),
    getFeatures({
      feature: omit(DATASETS.area_afp.layer, ["renderer"]),
      query: DATASETS.area_afp.getFeatures({ returnGeometry: true }),
    }),
  ]);

  const amazoniaGeometry = amazonia.features[0]?.geometry;
  if (!amazoniaGeometry) return [];

  const boundaryByCountry = new Map<string, __esri.GeometryUnion>();
  for (const feature of admin0.features) {
    const iso3 = feature.attributes?.GID_0;
    if (typeof iso3 !== "string" || !feature.geometry) continue;

    const geometry = intersectionOperator.execute(feature.geometry, amazoniaGeometry);
    if (geometry) boundaryByCountry.set(iso3, geometry);
  }

  return modules.flatMap(({ slug, country }) => {
    const geometry = boundaryByCountry.get(country);
    return geometry ? [{ slug, country, geometry }] : [];
  });
};

export const getLiveCountryBoundariesKey = (modules: readonly CountryModule[]) =>
  [
    "country-coverage",
    "boundaries",
    modules.map(({ slug, country }) => `${slug}:${country}`),
  ] as const;

export const useGetLiveCountryBoundaries = (
  modules: readonly CountryModule[],
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: getLiveCountryBoundariesKey(modules),
    queryFn: () => getLiveCountryBoundaries(modules),
    staleTime: Infinity,
    ...options,
    enabled: modules.length > 0 && (options?.enabled ?? true),
  });

export const getCountryCoverageRatio = (
  geometry: __esri.GeometryUnion | null,
  boundary: __esri.GeometryUnion | null,
): number => {
  if (!geometry || !boundary) return 0;

  const geometryArea = geodeticAreaOperator.execute(geometry, { unit: "square-kilometers" });
  if (geometryArea <= 0) return 0;

  const intersection = intersectionOperator.execute(geometry, boundary);
  if (!intersection) return 0;

  const intersectionArea = geodeticAreaOperator.execute(intersection, {
    unit: "square-kilometers",
  });

  return Math.min(intersectionArea / geometryArea, 1);
};

export const getCountryCoveragePercent = (ratio: number): number => Math.round(ratio * 100);

// Strictly greater than 50%: exactly 50% stays on the "does not switch" side (AC3).
export const isCountryCoverageDominant = (ratio: number): boolean =>
  ratio > COUNTRY_COVERAGE_ACTIVATION_THRESHOLD;
