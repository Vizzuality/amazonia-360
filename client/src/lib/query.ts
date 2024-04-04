import { getCookie } from "react-use-cookie";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as geoprocessor from "@arcgis/core/rest/geoprocessor";
import Query from "@arcgis/core/rest/support/Query";
import {
  QueryFunction,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";

import { env } from "@/env.mjs";

/**
 ************************************************************
 ************************************************************
 * Get Features
 ************************************************************
 ************************************************************
 */
export type GetFeaturesParams = {
  query?: Query;
  feature?: FeatureLayer;
};
export const getFeatures = async (params: GetFeaturesParams) => {
  const { feature, query } = params;

  if (!feature || !query) {
    throw new Error("Feature and query are required");
  }

  const f = feature.clone();
  const q = query.clone();

  f!.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;

  return feature!.queryFeatures(q);
};

export const getFeaturesKey = (params: GetFeaturesParams) => {
  const { feature, query } = params;
  return ["arcgis", "query", feature?.id, query?.toJSON() ?? {}] as const;
};

export const getFeaturesOptions = <
  TData = Awaited<ReturnType<typeof getFeatures>>,
  TError = unknown,
>(
  params: GetFeaturesParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getFeatures>>, TError, TData>,
    "queryKey"
  >,
) => {
  const queryKey = getFeaturesKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFeatures>>> = () =>
    getFeatures(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getFeatures>>,
    TError,
    TData
  >;
};

export const useGetFeatures = <
  TData = Awaited<ReturnType<typeof getFeatures>>,
  TError = unknown,
>(
  params: GetFeaturesParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getFeatures>>, TError, TData>,
    "queryKey"
  >,
) => {
  const { queryKey, queryFn } = getFeaturesOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Get FeaturesId
 ************************************************************
 ************************************************************
 */

export type GetFeaturesIdParams = {
  id: string | number | null;
} & GetFeaturesParams;
export const getFeaturesId = async (params: GetFeaturesIdParams) => {
  const { id, feature, query } = params;

  if (!feature || !query || !id) {
    throw new Error("Feature and query are required");
  }

  const f = feature.clone();
  const q = query.clone();

  q!.where = `FID = ${params.id}`;
  f!.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;

  return f!.queryFeatures(q);
};

export const getFeaturesIdKey = (params: GetFeaturesIdParams) => {
  const { feature, query } = params;
  return [
    "arcgis",
    "query",
    params.id,
    feature?.id,
    query?.toJSON() ?? {},
  ] as const;
};

export const getFeaturesIdOptions = <
  TData = Awaited<ReturnType<typeof getFeaturesId>>,
  TError = unknown,
>(
  params: GetFeaturesIdParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getFeaturesId>>, TError, TData>,
    "queryKey"
  >,
) => {
  const queryKey = getFeaturesIdKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getFeaturesId>>
  > = () => getFeaturesId(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getFeaturesId>>,
    TError,
    TData
  >;
};

export const useGetFeaturesId = <
  TData = Awaited<ReturnType<typeof getFeaturesId>>,
  TError = unknown,
>(
  params: GetFeaturesIdParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getFeaturesId>>, TError, TData>,
    "queryKey"
  >,
) => {
  const { queryKey, queryFn } = getFeaturesIdOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Synchronous analysis
 ************************************************************
 ************************************************************
 */
export type GetAnalysisParams = {
  in_feature1?: unknown;
  in_feature2?: unknown;
};
export const getAnalysis = async (params: GetAnalysisParams) => {
  const { in_feature1, in_feature2 } = params;

  if (!in_feature1 || !in_feature2) {
    throw new Error("in_feature1 and in_feature2 are required");
  }

  const token = getCookie("arcgis_token");

  return geoprocessor!.execute(
    "https://atlas.iadb.org/server/rest/services/ClipLayer/GPServer/Clip%20Layer",
    {
      in_feature1,
      in_feature2,
      token,
    },
    undefined,
    {
      withCredentials: true,
    },
  );
};

export const getAnalysisKey = (params: GetAnalysisParams) => {
  const { in_feature1, in_feature2 } = params;
  return [
    "arcgis",
    "analysis",
    JSON.stringify(in_feature1),
    JSON.stringify(in_feature2),
  ] as const;
};

export const getAnalysisOptions = <
  TData = Awaited<ReturnType<typeof getAnalysis>>,
  TError = unknown,
>(
  params: GetAnalysisParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getAnalysis>>, TError, TData>,
    "queryKey"
  >,
) => {
  const queryKey = getAnalysisKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getAnalysis>>> = () =>
    getAnalysis(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getAnalysis>>,
    TError,
    TData
  >;
};

export const useGetAnalysis = <
  TData = Awaited<ReturnType<typeof getAnalysis>>,
  TError = unknown,
>(
  params: GetAnalysisParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getAnalysis>>, TError, TData>,
    "queryKey"
  >,
) => {
  const { queryKey, queryFn } = getAnalysisOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
