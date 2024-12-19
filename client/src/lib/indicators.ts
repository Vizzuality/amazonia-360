import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Query from "@arcgis/core/rest/support/Query";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";

import INDICATORS from "@/app/local-api/indicators/indicators.json";
import {
  Indicator,
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
  VisualizationType,
} from "@/app/local-api/indicators/route";
import { Topic } from "@/app/local-api/topics/route";
import TOPICS from "@/app/local-api/topics/topics.json";

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
  const indicators = INDICATORS as Indicator[];
  const topics = TOPICS as Topic[];

  return indicators.map((indicator) => ({
    ...indicator,
    topic: topics.find((topic) => topic.id === indicator.topic),
  })) as (Indicator & { topic: Topic })[];
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
export type QueryFeatureIdParams = {
  id: Indicator["id"];
  type: VisualizationType;
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

    if (q.returnIntersections) {
      const geoms = fs.features.map((f) => f.geometry).filter(Boolean);

      if (!geometry || geoms.length === 0) {
        return null;
      }

      const intersections = (await geometryEngineAsync.intersect(
        geoms,
        geometry,
      )) as unknown as __esri.Polygon[];

      const geometryArea = geometryEngine.geodesicArea(geometry, "square-kilometers");

      return new Promise<__esri.FeatureSet>((resolve) => {
        // TODO: intersections lenght could be more than the original features. So instead of looping the current feature set, we must create a new one with the intersections
        fs.features.forEach((f, i) => {
          f.setAttribute(
            "value",
            geometryEngine.geodesicArea(intersections[i], "square-kilometers"),
          );
          f.setAttribute("total", geometryArea);
        });

        resolve(fs);
      });
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

export type QueryImageryTileIdParams = {
  id: Indicator["id"];
  type: VisualizationType;
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
