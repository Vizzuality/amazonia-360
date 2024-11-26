import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import Query from "@arcgis/core/rest/support/Query";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";

import {
  Indicator,
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
  VisualizationType,
} from "@/app/api/indicators/route";
/**
 ************************************************************
 ************************************************************
 * INDICATORS
 * - useIndicators
 * - useIndicatorsId
 ************************************************************
 ************************************************************
 */
export type IndicatorsParams = unknown;

export type IndicatorsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getIndicators>>,
  TError,
  TData
>;

export const getIndicators = async () => {
  return axios.get<Indicator[]>("/api/indicators").then((response) => response.data);
};

export const getIndicatorsKey = () => {
  return ["indicators"];
};

export const getIndicatorsOptions = <
  TData = Awaited<ReturnType<typeof getIndicators>>,
  TError = unknown,
>(
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getIndicatorsKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getIndicators>>> = () => getIndicators();
  return { queryKey, queryFn, ...options } as IndicatorsQueryOptions<TData, TError>;
};

export const useIndicators = <TData = Awaited<ReturnType<typeof getIndicators>>, TError = unknown>(
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getIndicatorsOptions(options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useIndicatorsId = (id: Indicator["id"]) => {
  const { data } = useIndicators();

  return data?.find((indicator) => indicator.id === id);
};

export type ResourceIdParams = {
  resource: ResourceFeature | ResourceImageryTile | ResourceWebTile;
  session?: {
    token?: string;
    expires_in: number;
  };
};

export type ResourceIdQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getResourceId>>,
  TError,
  TData
>;

export const getResourceId = async ({ resource, session }: ResourceIdParams) => {
  return axios
    .get(resource.url, {
      params: {
        f: "json",
        token: session?.token,
      },
    })
    .then((response) => response.data);
};

export const getResourceIdKey = ({ resource }: ResourceIdParams) => {
  return ["resource", resource.url];
};

export const getResourceIdOptions = <
  TData = Awaited<ReturnType<typeof getResourceId>>,
  TError = unknown,
>(
  params: ResourceIdParams,
  options?: Omit<ResourceIdQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getResourceIdKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getResourceId>>> = () =>
    getResourceId(params);
  return { queryKey, queryFn, ...options } as ResourceIdQueryOptions<TData, TError>;
};

export const useResourceId = <TData = Awaited<ReturnType<typeof getResourceId>>, TError = unknown>(
  params: ResourceIdParams,
  options?: Omit<ResourceIdQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getResourceIdOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * QUERIES
 * - useQueryFeatureId
 * - useQueryImageryTileId
 ************************************************************
 ************************************************************
 */

const GEOMETRY = {
  type: "polygon",
  spatialReference: { wkid: 102100 },
  rings: [
    [
      [-7766471.038835982, -1329452.5803468754],
      [-6879763.29221403, -1190719.3740093173],
      [-6518254.366939386, -1425075.3027316048],
      [-6563237.558085199, -1677317.4960726197],
      [-7389177.867220452, -1682285.902911155],
      [-7766471.038835982, -1329452.5803468754],
    ],
  ],
} as __esri.Polygon;

export type QueryFeatureIdParams = {
  type: VisualizationType;
  resource: ResourceFeature;
};

export const getQueryFeatureId = async ({ type, resource }: QueryFeatureIdParams) => {
  const f = new FeatureLayer({
    url: resource.url + resource.layer_id,
  });

  const q = resource[`query_${type}`];

  if (q) {
    const query = new Query(q);
    query.geometry = GEOMETRY;
    return f.queryFeatures(query);
  }

  return null;
};

export const getQueryFeatureIdKey = ({ type, resource }: QueryFeatureIdParams) => {
  return ["query-feature", type, resource.url];
};

export const getQueryFeatureIdOptions = <
  TData = Awaited<ReturnType<typeof getQueryFeatureId>>,
  TError = unknown,
>(
  params: QueryFeatureIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getQueryFeatureIdKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getQueryFeatureId>>> = () =>
    getQueryFeatureId(params);
  return { queryKey, queryFn, ...options } as IndicatorsQueryOptions<TData, TError>;
};

export const useQueryFeatureId = <
  TData = Awaited<ReturnType<typeof getQueryFeatureId>>,
  TError = unknown,
>(
  params: QueryFeatureIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getQueryFeatureIdOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export type QueryImageryTileIdParams = {
  type: VisualizationType;
  resource: ResourceImageryTile;
};

export const getQueryImageryTileId = async ({
  resource,
}: QueryImageryTileIdParams): Promise<{
  RAT: {
    features: {
      attributes: {
        Value: number;
        Class: string;
        Red: number;
        Green: number;
        Blue: number;
        Alpha: number;
      };
    }[];
  };
  histograms: {
    min: number;
    max: number;
    size: number;
    counts: number[];
  }[];
  statistics: {
    min: number;
    max: number;
    stddev: number;
    median: number;
    mode: number;
    sum: number;
    avg: number;
  }[];
} | null> => {
  const f = new ImageryTileLayer({
    url: resource.url,
  });

  try {
    const RAT = await axios
      .get<{
        features: {
          Value: number;
          Class: string;
          Red: number;
          Green: number;
          Blue: number;
          Alpha: number;
        }[];
      }>(`${resource.url}/rasterattributetable`, {
        params: {
          f: "json",
        },
      })
      .then((response) => response.data);

    const statistics = await f.computeStatisticsHistograms({
      geometry: GEOMETRY,
    });

    return {
      RAT,
      ...statistics,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getQueryImageryTileIdKey = ({ type, resource }: QueryImageryTileIdParams) => {
  return ["query-imagery-tile", type, resource.url];
};

export const getQueryImageryTileIdOptions = <
  TData = Awaited<ReturnType<typeof getQueryImageryTileId>>,
  TError = unknown,
>(
  params: QueryImageryTileIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getQueryImageryTileIdKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getQueryImageryTileId>>> = () =>
    getQueryImageryTileId(params);
  return { queryKey, queryFn, ...options } as IndicatorsQueryOptions<TData, TError>;
};

export const useQueryImageryTileId = <
  TData = Awaited<ReturnType<typeof getQueryImageryTileId>>,
  TError = unknown,
>(
  params: QueryImageryTileIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getQueryImageryTileIdOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
