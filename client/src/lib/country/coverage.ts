"use client";

import * as geodeticAreaOperator from "@arcgis/core/geometry/operators/geodeticAreaOperator";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { COUNTRIES, CountryCode, isCountryCode } from "@/lib/country";
import { getFeatures } from "@/lib/query";
import { omit } from "@/lib/utils";

import { DATASETS } from "@/constants/datasets";

export const COUNTRY_COVERAGE_ACTIVATION_THRESHOLD = 0.5;

// The module boundary is admin0[GID_0=code] ∩ area_afp: delivered indicators are clipped
// to that intersection, not to the country alone.
export const getCountryAmazoniaBoundary = async (
  code: string,
): Promise<__esri.GeometryUnion | null> => {
  if (!isCountryCode(code)) return null;

  const [country, amazonia] = await Promise.all([
    getFeatures({
      feature: DATASETS.admin0.layer,
      query: DATASETS.admin0.getFeatures({
        where: `GID_0 = '${code}'`,
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

export const getCountryAmazoniaBoundaryKey = (code: string) =>
  ["country-coverage", "boundary", code] as const;

export type CountryAmazoniaBoundaryQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>,
  TError,
  TData
>;

export const getCountryAmazoniaBoundaryOptions = <
  TData = Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>,
  TError = unknown,
>(
  code: string,
  options?: Omit<CountryAmazoniaBoundaryQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getCountryAmazoniaBoundaryKey(code);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>> = () =>
    getCountryAmazoniaBoundary(code);

  return {
    queryKey,
    queryFn,
    enabled: isCountryCode(code),
    staleTime: Infinity,
    ...options,
  } as CountryAmazoniaBoundaryQueryOptions<TData, TError>;
};

export const useGetCountryAmazoniaBoundary = <
  TData = Awaited<ReturnType<typeof getCountryAmazoniaBoundary>>,
  TError = unknown,
>(
  code: string,
  options?: Omit<CountryAmazoniaBoundaryQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn, enabled, staleTime } = getCountryAmazoniaBoundaryOptions(
    code,
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

export type CountryBoundary = { code: CountryCode; geometry: __esri.GeometryUnion };

// One round trip for every live module: `area_afp` is a single large polygon and fetching it
// once per country would refetch it verbatim N times.
export const getLiveCountryBoundaries = async (): Promise<CountryBoundary[]> => {
  const codes = COUNTRIES.filter((entry) => entry.available).map((entry) => entry.code);
  if (codes.length === 0) return [];

  const [countries, amazonia] = await Promise.all([
    getFeatures({
      feature: DATASETS.admin0.layer,
      query: DATASETS.admin0.getFeatures({
        where: `GID_0 IN (${codes.map((code) => `'${code}'`).join(", ")})`,
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

  return countries.features.flatMap((feature) => {
    const code = feature.attributes?.GID_0;
    if (!isCountryCode(code) || !feature.geometry) return [];

    const geometry = intersectionOperator.execute(feature.geometry, amazoniaGeometry);
    return geometry ? [{ code, geometry }] : [];
  });
};

export const getLiveCountryBoundariesKey = () => ["country-coverage", "boundaries"] as const;

export const useGetLiveCountryBoundaries = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: getLiveCountryBoundariesKey(),
    queryFn: getLiveCountryBoundaries,
    staleTime: Infinity,
    ...options,
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
