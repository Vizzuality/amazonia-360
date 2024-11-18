import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Query from "@arcgis/core/rest/support/Query";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Indicator, ResourceFeature, VisualizationType } from "@/app/api/indicators/route";
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

/**
 ************************************************************
 ************************************************************
 * RESOURCES
 * - useQueryFeatureId
 ************************************************************
 ************************************************************
 */
export type ResourceIdParams = {
  type: VisualizationType;
  resource: ResourceFeature;
};

export const getQueryFeatureId = async ({ type, resource }: ResourceIdParams) => {
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

export const getQueryFeatureIdKey = ({ type, resource }: ResourceIdParams) => {
  return ["query-feature", type, resource.url];
};

export const getQueryFeatureIdOptions = <
  TData = Awaited<ReturnType<typeof getQueryFeatureId>>,
  TError = unknown,
>(
  params: ResourceIdParams,
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
  params: ResourceIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getQueryFeatureIdOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
