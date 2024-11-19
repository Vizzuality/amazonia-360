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
};

export type ResourceIdQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getResourceId>>,
  TError,
  TData
>;

export const getResourceId = async ({ resource }: ResourceIdParams) => {
  return axios
    .get(resource.url, {
      params: {
        f: "json",
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
    query.geometry = {
      type: "polygon",
      spatialReference: { wkid: 102100 },
      rings: [
        [
          [-7648399.591586382, -93947.23689839151],
          [-7316127.829630809, -387962.2661972437],
          [-7324918.087883603, -648001.0364233442],
          [-7615550.778680836, -840813.4402726502],
          [-7974116.878366503, -635656.4563552919],
          [-8079466.212600519, -359451.25464688055],
          [-7648399.591586382, -93947.23689839151],
        ],
      ],
    } as __esri.Polygon;
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

export const getQueryImageryTileId = async ({ resource }: QueryImageryTileIdParams) => {
  const f = new ImageryTileLayer({
    url: resource.url,
  });

  return f.computeStatisticsHistograms({
    geometry: {
      type: "polygon",
      spatialReference: { wkid: 102100 },
      rings: [
        [
          [-7648399.591586382, -93947.23689839151],
          [-7316127.829630809, -387962.2661972437],
          [-7324918.087883603, -648001.0364233442],
          [-7615550.778680836, -840813.4402726502],
          [-7974116.878366503, -635656.4563552919],
          [-8079466.212600519, -359451.25464688055],
          [-7648399.591586382, -93947.23689839151],
        ],
      ],
    },
  });
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
