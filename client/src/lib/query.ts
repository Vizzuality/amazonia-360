import { getCookie } from "react-use-cookie";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";
// import * as geodesicUtils from "@arcgis/core/geometry/support/geodesicUtils";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as geoprocessor from "@arcgis/core/rest/geoprocessor";
import Query from "@arcgis/core/rest/support/Query";
import {
  QueryFunction,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";

import { env } from "@/env.mjs";

import { DATASETS, DatasetIds } from "@/constants/datasets";

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
 * Client analysis
 ************************************************************
 ************************************************************
 */
export type GetClientAnalysisParams = {
  id: DatasetIds;
  polygon?: __esri.Polygon | null;
};

export type ClientAnalysisQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getClientAnalysis>>,
  TError,
  TData
>;

export const getClientAnalysis = async (params: GetClientAnalysisParams) => {
  const { id, polygon } = params;

  if (!id || !polygon) {
    throw new Error("Polygon is required");
  }

  const q = DATASETS[id]
    .getFeatures({
      geometry: polygon,
      returnGeometry: true,
    })
    .clone();

  const f = DATASETS[id].layer.clone();

  try {
    const featureSet = await f.queryFeatures(q);
    const geoms = featureSet.features.map((f) => f.geometry).filter(Boolean);

    if (geoms.length === 0) {
      return {};
    }

    const results = (await geometryEngineAsync.intersect(
      geoms,
      polygon,
    )) as unknown as __esri.Polygon[];

    const areas = results
      .map((r) => {
        const area = geometryEngine.geodesicArea(r, "square-kilometers");
        return area;
      })
      .reduce((acc, a) => acc + a, 0);

    const polygonArea = geometryEngine.geodesicArea(
      polygon,
      "square-kilometers",
    );

    return {
      percentage: areas / polygonArea,
    };
  } catch (error) {
    throw new Error(`Error getting features: ${error}`);
  }
};

export const getClientAnalysisKey = (params: GetClientAnalysisParams) => {
  const { id } = params;
  return ["arcgis", "analysis", id] as const;
};

export const getClientAnalysisOptions = <
  TData = Awaited<ReturnType<typeof getClientAnalysis>>,
  TError = unknown,
>(
  params: GetClientAnalysisParams,
  options?: Omit<ClientAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getClientAnalysisKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getClientAnalysis>>
  > = () => getClientAnalysis(params);
  return { queryKey, queryFn, ...options } as ClientAnalysisQueryOptions<
    TData,
    TError
  >;
};

export const useGetClientAnalysis = <
  TData = Awaited<ReturnType<typeof getClientAnalysis>>,
  TError = unknown,
>(
  params: GetClientAnalysisParams,
  options?: Omit<ClientAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getClientAnalysisOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Server analysis
 ************************************************************
 ************************************************************
 */
export type GetServerAnalysisParams = {
  in_feature1?: unknown;
  in_feature2?: unknown;
};

export type ServerAnalysisQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getServerAnalysis>>,
  TError,
  TData
>;

export const getServerAnalysis = async (params: GetServerAnalysisParams) => {
  const { in_feature1, in_feature2 } = params;

  if (!in_feature1 || !in_feature2) {
    throw new Error("in_feature1 and in_feature2 are required");
  }

  const token = getCookie("arcgis_token");

  return geoprocessor.submitJob(
    "https://atlas.iadb.org/server/rest/services/System/SpatialAnalysisTools/GPServer/OverlayLayers",
    {
      inputLayer: in_feature1,
      overlayLayer: in_feature2,
      token,
    },
  );

  // return geoprocessor!.execute(
  //   "https://atlas.iadb.org/server/rest/services/ClipLayer/GPServer/Clip%20Layer",
  //   {
  //     in_feature1,
  //     in_feature2,
  //     token,
  //   },
  //   undefined,
  //   {
  //     withCredentials: true,
  //   },
  // );
};

export const getServerAnalysisKey = (params: GetServerAnalysisParams) => {
  const { in_feature1, in_feature2 } = params;
  return [
    "arcgis",
    "analysis",
    JSON.stringify(in_feature1),
    JSON.stringify(in_feature2),
  ] as const;
};

export const getServerAnalysisOptions = <
  TData = Awaited<ReturnType<typeof getServerAnalysis>>,
  TError = unknown,
>(
  params: GetServerAnalysisParams,
  options?: Omit<ServerAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getServerAnalysisKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getServerAnalysis>>
  > = () => getServerAnalysis(params);
  return { queryKey, queryFn, ...options } as ServerAnalysisQueryOptions<
    TData,
    TError
  >;
};

export const useGetServerAnalysis = <
  TData = Awaited<ReturnType<typeof getServerAnalysis>>,
  TError = unknown,
>(
  params: GetServerAnalysisParams,
  options?: Omit<ServerAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getServerAnalysisOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
