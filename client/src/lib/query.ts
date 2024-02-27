import { QueryFunction, UseQueryOptions, useQuery } from "react-query";

import Geometry from "@arcgis/core/geometry/Geometry";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Query from "@arcgis/core/rest/support/Query";

import { env } from "@/env.mjs";

export type ArcGISQueryParams = {
  query?: Query;
  feature?: FeatureLayer;
  geometry?: Geometry;
};

/**
 ************************************************************
 ************************************************************
 * Query FEATURES
 ************************************************************
 ************************************************************
 */
export const getFeatures = async (params: ArcGISQueryParams) => {
  const { feature, query, geometry } = params;

  if (!feature || !query) {
    throw new Error("Feature and query are required");
  }

  feature!.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;
  if (geometry) {
    query!.geometry = geometry;
  }
  return feature!.queryFeatures(query);
};

export const getFeaturesQueryKey = (params: ArcGISQueryParams) => {
  const { feature, query } = params;
  return ["arcgis", "query", feature?.id, query?.toJSON() ?? {}] as const;
};

export const useGetArcGISQueryOptions = <
  TData = Awaited<ReturnType<typeof getFeatures>>,
  TError = unknown,
>(
  params: ArcGISQueryParams,
  options: UseQueryOptions<
    Awaited<ReturnType<typeof getFeatures>>,
    TError,
    TData
  >,
) => {
  const queryKey = getFeaturesQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFeatures>>> = () =>
    getFeatures(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getFeatures>>,
    TError,
    TData
  >;
};

export const useGetArcGISQueryFeatures = <
  TData = Awaited<ReturnType<typeof getFeatures>>,
  TError = unknown,
>(
  params: ArcGISQueryParams,
  options?: UseQueryOptions<
    Awaited<ReturnType<typeof getFeatures>>,
    TError,
    TData
  >,
) => {
  const queryKey = options?.queryKey ?? getFeaturesQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFeatures>>> = () =>
    getFeatures(params);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
