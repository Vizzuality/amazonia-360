import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Query from "@arcgis/core/rest/support/Query";
import { QueryFunction, UseQueryOptions, useQuery, useQueries } from "@tanstack/react-query";
import axios from "axios";

import INDICATORS from "@/app/local-api/indicators/indicators.json";
import {
  Indicator,
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
  VisualizationTypes,
} from "@/app/local-api/indicators/route";
import { Topic } from "@/app/local-api/topics/route";
import TOPICS from "@/app/local-api/topics/topics.json";

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

export const getIndicators = async () => {
  const indicators = INDICATORS;
  const topics = TOPICS as Topic[];

  return indicators
    .map(
      (indicator) =>
        ({
          ...indicator,
          topic: topics.find((topic) => topic.id === indicator.topic),
        }) as Indicator,
    )
    .sort((a, b) => (a.name_en || "")?.localeCompare(b.name_en || ""));
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

export const useGetIndicators = <
  TData = Awaited<ReturnType<typeof getIndicators>>,
  TError = unknown,
>(
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getIndicatorsOptions(options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useGetDefaultIndicators = (
  topic_id: Topic["id"] | undefined,
  options: Omit<IndicatorsQueryOptions<Indicator[], unknown>, "queryKey"> = {},
) => {
  const query = useGetIndicators({
    select(data) {
      return data.filter((indicator) => {
        const t = topic_id ? indicator.topic.id === topic_id : true;

        return indicator.topic.id !== 0 && indicator.resource.type !== "h3" && t;
      });
    },
    ...options,
  });

  return query;
};

export const useGetH3Indicators = () => {
  const query = useGetIndicators({
    select(data) {
      return data
        .filter((indicator) => indicator.resource.type === "h3")
        .map((indicator) => ({
          ...indicator,
          resource: indicator.resource as Indicator["resource"] & { type: "h3" },
        }));
    },
  });

  return query;
};

export const useGetIndicatorsId = (id: Indicator["id"]) => {
  const { data } = useGetIndicators();

  return data?.find((indicator) => indicator.id === id);
};

/**
 ************************************************************
 ************************************************************
 * RESOURCE ID
 * - useResourceId
 * - useResourceFeatureLayerId
 ************************************************************
 ************************************************************
 */
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
      const geometryArea = geometryEngine.geodesicArea(geometry, "square-kilometers");

      await Promise.all(
        fs.features.map(async (f) => {
          if (!f.geometry) return null;

          const intersections = (await geometryEngineAsync.intersect(
            [f.geometry],
            geometry,
          )) as unknown as __esri.Polygon[] | null[];

          f.setAttribute(
            "value",
            intersections.reduce((acc, i) => {
              if (!i) return acc;

              return acc + geometryEngine.geodesicArea(i, "square-kilometers");
            }, 0),
          );
          f.setAttribute("total", geometryArea);
        }),
      );

      // Group all results by label
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
      queryKey: ["featureId", id, resource],
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
    const id = indicators[index]?.id || `Unknown (${indicators[index]?.name_en})`;

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
