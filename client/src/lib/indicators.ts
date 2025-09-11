"use client";

import { useMemo } from "react";

import { QueryFunction, UseQueryOptions, useQuery, useQueries } from "@tanstack/react-query";
import axios from "axios";

import {
  Indicator,
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
  ResourceWebTile,
  VisualizationTypes,
} from "@/types/indicator";
import { Topic } from "@/types/topic";

import { LayerProps } from "@/components/map/layers/types";

import INDICATORS from "@/../datum/indicators.json";
import TOPICS from "@/../datum/topics.json";

/**
 ************************************************************
 ************************************************************
 * INDICATORS
 * - useGetIndicators
 * - useGetDefaultIndicators
 * - useGetH3Indicators
 * - useGetIndicatorsId
 ************************************************************
 ************************************************************
 */
export type IndicatorsParams = unknown;

export type IndicatorsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getIndicators>>,
  TError,
  TData
>;

export const getIndicators = async (locale: string) => {
  const indicators = INDICATORS;
  const topics = TOPICS as Topic[];

  return indicators
    .map(
      (indicator) =>
        ({
          ...indicator,
          name: indicator[`name_${locale}` as keyof typeof indicator],
          description: indicator[`description_${locale}` as keyof typeof indicator],
          description_short: indicator[`description_short_${locale}` as keyof typeof indicator],
          unit: indicator[`unit_${locale}` as keyof typeof indicator],
          topic: topics.find((topic) => topic.id === indicator.topic),
        }) as Indicator,
    )
    .sort((a, b) => (a.name || "")?.localeCompare(b.name || ""));
};

export const getIndicatorsKey = (locale: string) => {
  return ["indicators", locale];
};

export const getIndicatorsOptions = <
  TData = Awaited<ReturnType<typeof getIndicators>>,
  TError = unknown,
>(
  locale: string,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getIndicatorsKey(locale);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getIndicators>>> = () =>
    getIndicators(locale);
  return { queryKey, queryFn, ...options } as IndicatorsQueryOptions<TData, TError>;
};

export const useGetIndicators = <
  TData = Awaited<ReturnType<typeof getIndicators>>,
  TError = unknown,
>(
  locale: string,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getIndicatorsOptions(locale, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useGetDefaultIndicators = (
  topic_id: Topic["id"] | undefined,
  locale: string,
  options: Omit<IndicatorsQueryOptions<Indicator[], unknown>, "queryKey"> = {},
) => {
  const query = useGetIndicators(locale, {
    select(data) {
      return data
        .filter((indicator) => {
          const t = topic_id ? indicator.topic.id === topic_id : true;

          return indicator.topic.id !== 0 && indicator.resource.type !== "h3" && t;
        })
        .sort((a, b) => a.order - b.order);
    },
    ...options,
  });

  return query;
};

export const useGetH3Indicators = (topic_id: Topic["id"] | undefined, locale: string) => {
  const query = useGetIndicators(locale, {
    select(data) {
      return data
        .filter((indicator) => {
          const t = topic_id ? indicator.topic.id === topic_id : true;

          return indicator.topic.id !== 0 && indicator.resource.type === "h3" && t;
        })
        .map((indicator) => ({
          ...indicator,
          resource: indicator.resource as Indicator["resource"] & { type: "h3" },
        }))
        .sort((a, b) => a.order - b.order);
    },
  });

  return query;
};

export const useGetIndicatorsId = (id: Indicator["id"], locale: string) => {
  const { data } = useGetIndicators(locale);

  return data?.find((indicator) => indicator.id === id);
};

export const useGetIndicatorsLayerId = (
  id: Indicator["id"],
  locale: string,
  settings: Record<string, unknown>,
) => {
  const indicatorData = useGetIndicatorsId(id, locale);
  const resource = indicatorData?.resource;

  return useMemo(() => {
    if (!resource || resource.type === "h3" || resource.type === "component") return null;

    if (resource.type === "web-tile") {
      return {
        id: `${id}`,
        urlTemplate: resource.url,
        type: "web-tile",
        ...settings,
      } satisfies LayerProps;
    }

    if (resource.type === "imagery-tile") {
      return {
        id: `${id}`,
        url: resource.url,
        type: "imagery-tile",
        rasterFunction: resource.rasterFunction,
        ...settings,
      } satisfies LayerProps;
    }

    if (resource.type === "imagery") {
      return {
        id: `${id}`,
        url: resource.url,
        type: "imagery",
        rasterFunction: resource.rasterFunction,
        ...settings,
      } satisfies LayerProps;
    }

    return {
      id: `${id}`,
      url: resource.url + resource.layer_id,
      type: "feature",
      popupTemplate: resource.popupTemplate,
      ...settings,
    } satisfies LayerProps;
  }, [id, resource, settings]);
};

/**
 ************************************************************
 ************************************************************
 * RESOURCE ID
 * - useResourceId
 * - useResourceFeatureLayerId
 * - useResourceImageryLegendId
 ************************************************************
 ************************************************************
 */
export type ResourceIdParams = {
  resource: ResourceFeature | ResourceImageryTile | ResourceWebTile | ResourceImagery;
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

export type ResourceFeatureLayerIdParams = {
  resource: ResourceFeature;
};

export type ResourceFeatureLayerIdQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getResourceFeatureLayerId>>,
  TError,
  TData
>;

export const getResourceFeatureLayerId = async ({ resource }: ResourceFeatureLayerIdParams) => {
  return axios
    .get(`${resource.url}/${resource.layer_id}`, {
      params: {
        f: "json",
      },
    })
    .then((response) => response.data);
};

export const getResourceFeatureLayerIdKey = ({ resource }: ResourceFeatureLayerIdParams) => {
  return ["resource", resource.url, resource.layer_id];
};

export const getResourceFeatureLayerIdOptions = <
  TData = Awaited<ReturnType<typeof getResourceFeatureLayerId>>,
  TError = unknown,
>(
  params: ResourceFeatureLayerIdParams,
  options?: Omit<ResourceFeatureLayerIdQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getResourceFeatureLayerIdKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getResourceFeatureLayerId>>> = () =>
    getResourceFeatureLayerId(params);
  return { queryKey, queryFn, ...options } as ResourceFeatureLayerIdQueryOptions<TData, TError>;
};

export const useResourceFeatureLayerId = <
  TData = Awaited<ReturnType<typeof getResourceFeatureLayerId>>,
  TError = unknown,
>(
  params: ResourceFeatureLayerIdParams,
  options?: Omit<ResourceFeatureLayerIdQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getResourceFeatureLayerIdOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export type ResourceImageryLegendIdParams = {
  resource: ResourceImagery | ResourceImageryTile;
};

export type ResourceImageryLegendIdQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getResourceImageryLegendId>>,
  TError,
  TData
>;

export const getResourceImageryLegendId = async ({ resource }: ResourceImageryLegendIdParams) => {
  return axios
    .get(`${resource.url}/legend`, {
      params: {
        // renderingRule: JSON.stringify(resource.rasterFunction),
        f: "json",
      },
    })
    .then(
      (response) =>
        response.data as {
          layers: {
            id: number;
            title: string;
            legend: {
              label: string;
              imageData: string;
            }[];
          }[];
        },
    );
};

export const getResourceImageryLegendIdKey = ({ resource }: ResourceImageryLegendIdParams) => {
  return ["legend", resource.url, resource.rasterFunction];
};

export const getResourceImageryLegendIdOptions = <
  TData = Awaited<ReturnType<typeof getResourceImageryLegendId>>,
  TError = unknown,
>(
  params: ResourceImageryLegendIdParams,
  options?: Omit<ResourceImageryLegendIdQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getResourceImageryLegendIdKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getResourceImageryLegendId>>> = () =>
    getResourceImageryLegendId(params);
  return { queryKey, queryFn, ...options } as ResourceImageryLegendIdQueryOptions<TData, TError>;
};

export const useResourceImageryLegendId = <
  TData = Awaited<ReturnType<typeof getResourceImageryLegendId>>,
  TError = unknown,
>(
  params: ResourceImageryLegendIdParams,
  options?: Omit<ResourceImageryLegendIdQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getResourceImageryLegendIdOptions(params, options);

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
  id: Indicator["id"];
  type: VisualizationTypes;
  resource: ResourceFeature;
  geometry: __esri.Polygon | null;
};

export const getQueryFeatureId = async ({ type, resource, geometry }: QueryFeatureIdParams) => {
  const FeatureLayer = (await import("@arcgis/core/layers/FeatureLayer")).default;
  const Query = (await import("@arcgis/core/rest/support/Query")).default;
  const geodesicArea = (await import("@arcgis/core/geometry/geometryEngine")).geodesicArea;
  const intersect = (await import("@arcgis/core/geometry/geometryEngineAsync")).intersect;

  const f = new FeatureLayer({
    url: resource.url + resource.layer_id,
  });

  const q = resource[`query_${type}`];

  if (q) {
    const query = new Query(q);

    if (geometry) {
      query.geometry = geometry;
    }

    if (q.returnIntersections) {
      query.returnGeometry = true;
    }

    const fs = await f.queryFeatures(query);

    if (q.returnIntersections && fs.geometryType === "polygon") {
      if (!geometry) {
        return null;
      }
      const geometryArea = geodesicArea(geometry, "square-kilometers");

      await Promise.all(
        fs.features.map(async (f) => {
          if (!f.geometry) return null;

          const intersections = (await intersect([f.geometry], geometry)) as unknown as
            | __esri.Polygon[]
            | null[];

          f.setAttribute(
            "value",
            intersections.reduce((acc, i) => {
              if (!i) return acc;

              return acc + geodesicArea(i, "square-kilometers");
            }, 0),
          );
          f.setAttribute("total", geometryArea);
        }),
      );

      // Group all results by label

      if (!!fs.fields.find((f) => f.name === "label" || f.alias === "label")) {
        const features = fs.features.reduce((acc, curr) => {
          const index = acc.findIndex((f) => f.attributes.label === curr.attributes.label);

          if (index === -1) {
            // If no feature with the same label exists, add the current feature to the accumulator
            acc.push(curr);
          } else {
            // If a feature with the same label exists, aggregate the values and update the total
            acc[index].setAttribute("value", acc[index].attributes.value + curr.attributes.value);
            acc[index].setAttribute("total", geometryArea);
          }

          return acc;
        }, [] as __esri.Graphic[]);

        fs.features = features;
      }
    }

    return fs;
  }

  return null;
};

export const getQueryFeatureIdKey = ({ id, type, resource, geometry }: QueryFeatureIdParams) => {
  return ["query-feature", id, type, resource.url, geometry?.toJSON()];
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

export const useQueryFeatures = (
  indicators: Indicator[],
  geometry: QueryFeatureIdParams["geometry"],
) => {
  const queries = useQueries({
    queries: indicators?.map(({ id, resource }) => ({
      queryKey: ["featureId", id, resource, geometry?.toJSON()],
      queryFn: () =>
        getQueryFeatureId({
          id,
          resource: resource as ResourceFeature,
          type: "numeric",
          geometry,
        }),
      enabled: !!id && !!resource && !!geometry,
    })),
  });

  return queries.reduce((acc: { [key: string]: number }, query, index) => {
    const id = indicators[index]?.id || `Unknown (${indicators[index]?.name})`;

    if (!query.data) {
      acc[id] = 0;
      return acc;
    }

    const total = query.data.features.reduce((sum, curr) => {
      return sum + (curr.attributes?.value || 0);
    }, 0);

    acc[id] = total;
    return acc;
  }, {});
};

export type QueryImageryIdParams = {
  id: Indicator["id"];
  type: VisualizationTypes;
  resource: ResourceImagery;
  geometry: __esri.Polygon | null;
};

export const getQueryImageryId = async ({
  resource,
  geometry,
}: QueryImageryIdParams): Promise<{
  histograms: __esri.RasterHistogram[];
  statistics: __esri.RasterBandStatistics[];
} | null> => {
  const ImageryLayer = (await import("@arcgis/core/layers/ImageryLayer")).default;
  const f = new ImageryLayer({
    url: resource.url,
  });

  return f.computeStatisticsHistograms({
    ...(!!geometry && { geometry }),
  });
};

export const getQueryImageryIdKey = ({ id, type, resource, geometry }: QueryImageryIdParams) => {
  return ["query-imagery", id, type, resource.url, geometry?.toJSON()];
};

export const getQueryImageryIdOptions = <
  TData = Awaited<ReturnType<typeof getQueryImageryId>>,
  TError = unknown,
>(
  params: QueryImageryIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getQueryImageryIdKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getQueryImageryId>>> = () =>
    getQueryImageryId(params);
  return { queryKey, queryFn, ...options } as IndicatorsQueryOptions<TData, TError>;
};

export const useQueryImageryId = <
  TData = Awaited<ReturnType<typeof getQueryImageryId>>,
  TError = unknown,
>(
  params: QueryImageryIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getQueryImageryIdOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export type QueryImageryTileIdParams = {
  id: Indicator["id"];
  type: VisualizationTypes;
  resource: ResourceImageryTile;
  geometry: __esri.Polygon | null;
};

export const getQueryImageryTileId = async ({
  resource,
  geometry,
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
  histograms: __esri.RasterHistogram[];
  statistics: __esri.RasterBandStatistics[];
} | null> => {
  const ImageryTileLayer = (await import("@arcgis/core/layers/ImageryTileLayer")).default;
  const f = new ImageryTileLayer({
    url: resource.url,
  });

  try {
    const RAT = await axios
      .get<{
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
      }>(`${resource.url}/rasterattributetable`, {
        params: {
          f: "json",
        },
      })
      .then((response) => response.data);

    // If we only use Dynamic Layers this is the way to get more statistics

    // const statistics: {
    //   histograms: __esri.RasterHistogram[];
    //   statistics: __esri.RasterBandStatistics[];
    // } = await axios
    //   .request({
    //     url: `${resource.url}/computeStatisticsHistograms`,
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     data: {
    //       geometryType: "esriGeometryPolygon",
    //       geometry: JSON.stringify(geometry?.toJSON()),
    //       processAsMultidimensional: JSON.stringify(true),
    //       token,
    //       f: "pjson",
    //     },
    //   })
    //   .then((response) => response.data);
    const statistics: {
      histograms: __esri.RasterHistogram[];
      statistics: __esri.RasterBandStatistics[];
    } = await f.computeStatisticsHistograms({
      ...(!!geometry && { geometry }),
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

export const getQueryImageryTileIdKey = ({
  id,
  type,
  resource,
  geometry,
}: QueryImageryTileIdParams) => {
  return ["query-imagery-tile", id, type, resource.url, geometry?.toJSON()];
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
