import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";
import * as projection from "@arcgis/core/geometry/projection";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Query from "@arcgis/core/rest/support/Query";
import {
  QueryFunction,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";

import { StatsOps } from "@/types/generated/api.schemas";
import { exactZonalStatsExactZonalStatsPost } from "@/types/generated/raster";

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

  const q = query.clone();

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
 * CLIENT ANALYSIS
 * - useGetIntersectionAnalysis
 ************************************************************
 ************************************************************
 */
export type GetIntersectionAnalysisParams = {
  id: Exclude<
    DatasetIds,
    | "population"
    | "deprivation_index"
    | "land_cover"
    | "fires"
    | "elevation_ranges"
  >;
  polygon?: __esri.Polygon | null;
};

export type IntersectionAnalysisQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getIntersectionAnalysis>>,
  TError,
  TData
>;

export const getIntersectionAnalysis = async (
  params: GetIntersectionAnalysisParams,
) => {
  const { id, polygon } = params;

  const d = DATASETS[id];

  if (!id || !polygon || d.layer.type !== "feature") {
    throw new Error("Polygon is required or layer is not a feature layer");
  }

  const q = d
    .getFeatures({
      geometry: polygon,
      returnGeometry: true,
    })
    .clone();

  const f = d.layer.clone();

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

    const totalResults = (await geometryEngineAsync.union(
      results,
    )) as unknown as __esri.Polygon;

    const totalResultsArea = await geometryEngine.geodesicArea(
      totalResults,
      "square-kilometers",
    );

    const polygonArea = geometryEngine.geodesicArea(
      polygon,
      "square-kilometers",
    );

    return {
      features: featureSet.features.map((f, i) => ({
        ...f.toJSON(),
        area: geometryEngine.geodesicArea(results[i], "square-kilometers"),
      })),
      areas: totalResultsArea,
      polygonArea,
      percentage: totalResultsArea / polygonArea,
    };
  } catch (error) {
    throw new Error(`Error getting features: ${error}`);
  }
};

export const getIntersectionAnalysisKey = (
  params: GetIntersectionAnalysisParams,
) => {
  const { id, polygon } = params;
  return ["arcgis", "analysis", id, polygon?.toJSON()] as const;
};

export const getIntersectionAnalysisOptions = <
  TData = Awaited<ReturnType<typeof getIntersectionAnalysis>>,
  TError = unknown,
>(
  params: GetIntersectionAnalysisParams,
  options?: Omit<IntersectionAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getIntersectionAnalysisKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getIntersectionAnalysis>>
  > = () => getIntersectionAnalysis(params);
  return { queryKey, queryFn, ...options } as IntersectionAnalysisQueryOptions<
    TData,
    TError
  >;
};

export const useGetIntersectionAnalysis = <
  TData = Awaited<ReturnType<typeof getIntersectionAnalysis>>,
  TError = unknown,
>(
  params: GetIntersectionAnalysisParams,
  options?: Omit<IntersectionAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getIntersectionAnalysisOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * CLIENT ANALYSIS
 * - useGetRasterAnalysis
 ************************************************************
 ************************************************************
 */
export type GetRasterAnalysisParams = {
  id:
    | "landcover"
    | "population"
    | "fires"
    | "elevation_ranges"
    | "deprivation_index";
  polygon?: __esri.Polygon | null;
  statistics?: StatsOps[];
};

export type RasterAnalysisQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getRasterAnalysis>>,
  TError,
  TData
>;

export const getRasterAnalysis = async (params: GetRasterAnalysisParams) => {
  const { id, polygon, statistics } = params;

  if (!id || !polygon) {
    throw new Error("Polygon is required");
  }

  const projectedGeom = projection.project(polygon, {
    wkid: 4326,
  });

  const geom = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;

  return exactZonalStatsExactZonalStatsPost(
    {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: geom.toJSON().rings,
          },
        },
      ],
    },
    {
      raster_filename: `${id}.tif`,
      statistics,
    },
  );
};

export const getRasterAnalysisKey = (params: GetRasterAnalysisParams) => {
  const { id, polygon, statistics } = params;
  return ["arcgis", "analysis", id, polygon?.toJSON(), statistics] as const;
};

export const getRasterAnalysisOptions = <
  TData = Awaited<ReturnType<typeof getRasterAnalysis>>,
  TError = unknown,
>(
  params: GetRasterAnalysisParams,
  options?: Omit<RasterAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getRasterAnalysisKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getRasterAnalysis>>
  > = () => getRasterAnalysis(params);
  return { queryKey, queryFn, ...options } as RasterAnalysisQueryOptions<
    TData,
    TError
  >;
};

export const useGetRasterAnalysis = <
  TData = Awaited<ReturnType<typeof getRasterAnalysis>>,
  TError = unknown,
>(
  params: GetRasterAnalysisParams,
  options?: Omit<RasterAnalysisQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getRasterAnalysisOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Metadata
 ************************************************************
 ************************************************************
 */
export type GetMetadataParams = {
  id: DatasetIds;
};

export type MetadataQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getMetadata>>,
  TError,
  TData
>;

export const getMetadata = async (params: GetMetadataParams) => {
  const { id } = params;

  if (!id) {
    throw new Error("id is required");
  }

  const DATASET = DATASETS[id];

  if (!DATASET?.metadata?.url) {
    return new Promise<{ id: DatasetIds; metadata: string }>((resolve) => {
      resolve({
        id,
        metadata: "",
      });
    });
  }

  return axios
    .get(DATASET?.metadata?.url, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
    .then((res) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(res.data, "text/xml");

      const metadata = xmlDoc.getElementsByTagName("idAbs")[0];

      return {
        id,
        metadata: metadata?.textContent || "",
      };
    });
};

export const getMetadataKey = (params: GetMetadataParams) => {
  const { id } = params;
  return ["arcgis", "metadata", id] as const;
};

export const getMetadataOptions = <
  TData = Awaited<ReturnType<typeof getMetadata>>,
  TError = unknown,
>(
  params: GetMetadataParams,
  options?: Omit<MetadataQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getMetadataKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getMetadata>>> = () =>
    getMetadata(params);
  return { queryKey, queryFn, ...options } as MetadataQueryOptions<
    TData,
    TError
  >;
};

export const useGetMetadata = <
  TData = Awaited<ReturnType<typeof getMetadata>>,
  TError = unknown,
>(
  params: GetMetadataParams,
  options?: Omit<MetadataQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getMetadataOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
