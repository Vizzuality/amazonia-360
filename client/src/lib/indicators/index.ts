"use client";

import { useMemo } from "react";

import * as geodeticAreaOperator from "@arcgis/core/geometry/operators/geodeticAreaOperator";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";

import {
  AdminUnit,
  HierarchyLayer,
  belongsToAdminUnit,
  getAncestorAttributes,
  getCountryWhere,
  getHierarchyLayer,
  isAncestorLayer,
} from "@/lib/admin-hierarchy";
import { fetchIndicatorById, fetchIndicators } from "@/lib/cms-content";
import { getModuleSlugs } from "@/lib/country";
import { useGetActiveModuleSlugs } from "@/lib/country-modules";
import { getReadSignal } from "@/lib/indicators/deadline";

import {
  Indicator,
  ResourceFeature,
  ResourceH3,
  ResourceImagery,
  ResourceImageryTile,
  ResourceWebTile,
  VisualizationTypes,
} from "@/types/indicator";
import { Subtopic, Topic } from "@/types/topic";

import { LayerProps } from "@/components/map/layers/types";

import { useCountry } from "@/i18n/use-country";

export type IndicatorsParams = unknown;

/** A single slug (the URL's own module), the set a report stores, or null for regional only. */
export type CountryModules = string | readonly (string | null)[] | null;

export type IndicatorsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getIndicators>>,
  TError,
  TData
>;

export const getIndicators = async (
  locale: string,
  modules: readonly string[],
): Promise<Indicator[]> => {
  const indicators = await fetchIndicators({ locale, modules });

  return indicators.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

export const getIndicatorsKey = (locale: string, modules: readonly string[]) => {
  return ["indicators", locale, ...modules];
};

export const getIndicatorsOptions = <
  TData = Awaited<ReturnType<typeof getIndicators>>,
  TError = unknown,
>(
  locale: string,
  modules: readonly string[],
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getIndicatorsKey(locale, modules);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getIndicators>>> = () =>
    getIndicators(locale, modules);
  // Editorial content, and the report flow is four routes: without this every navigation
  // refetches the whole catalogue once the provider's 60s staleTime has passed.
  return { queryKey, queryFn, staleTime: Infinity, ...options } as IndicatorsQueryOptions<
    TData,
    TError
  >;
};

/**
 * `country` left out reads the URL's own module; passed explicitly (including `null`, for the
 * regional catalogue) it overrides the URL — the seam a report rendered outside its module uses.
 */
export const useGetIndicators = <
  TData = Awaited<ReturnType<typeof getIndicators>>,
  TError = unknown,
>(
  locale: string,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
  country?: CountryModules,
) => {
  const urlCountry = useCountry();
  const liveSlugs = useGetActiveModuleSlugs();
  const modules = getModuleSlugs(country === undefined ? urlCountry : country, liveSlugs);
  const { queryKey, queryFn, staleTime } = getIndicatorsOptions(locale, modules, options);

  return useQuery({
    queryKey,
    queryFn,
    staleTime,
    ...options,
  });
};

export const useGetDefaultIndicators = ({
  topicId,
  subtopicId,
  locale,
  country,
  options = {},
}: {
  topicId?: Topic["id"];
  subtopicId?: Subtopic["id"];
  locale: string;
  country?: CountryModules;
  options?: Omit<IndicatorsQueryOptions<Indicator[], unknown>, "queryKey">;
}) => {
  const query = useGetIndicators(
    locale,
    {
      select(data) {
        return data
          .filter((indicator) => {
            if (topicId) {
              return indicator.subtopic.topic_id === topicId && indicator.resource.type !== "h3";
            }

            if (subtopicId) {
              return indicator.subtopic.id === subtopicId && indicator.resource.type !== "h3";
            }

            return indicator.resource.type !== "h3";
          })
          .sort((a, b) => a.order - b.order);
      },
      ...options,
    },
    country,
  );

  return query;
};

export const useGetH3Indicators = ({
  topicId,
  subtopicId,
  locale,
  country,
}: {
  topicId?: Topic["id"];
  subtopicId?: Subtopic["id"];
  locale: string;
  country?: string | null;
}) => {
  const query = useGetIndicators(
    locale,
    {
      select(data) {
        return data
          .filter((indicator) => {
            if (topicId) {
              return indicator.subtopic.topic_id === topicId && indicator.resource.type === "h3";
            }

            if (subtopicId) {
              return indicator.subtopic.id === subtopicId && indicator.resource.type === "h3";
            }

            return indicator.resource.type === "h3";
          })
          .map((indicator) => ({
            ...indicator,
            resource: indicator.resource as ResourceH3,
          }))
          .sort((a, b) => a.order - b.order);
      },
    },
    country,
  );

  return query;
};

export const getIndicatorByIdKey = (id: Indicator["id"], locale: string) => [
  "indicator",
  id,
  locale,
];

export const useGetIndicatorById = (id: Indicator["id"], locale: string) =>
  useQuery({
    queryKey: getIndicatorByIdKey(id, locale),
    queryFn: () => fetchIndicatorById({ id, locale }),
    staleTime: Infinity,
  });

export const useGetIndicatorsId = (
  id: Indicator["id"],
  locale: string,
  country?: CountryModules,
) => {
  const { data } = useGetIndicators(locale, undefined, country);

  return data?.find((indicator) => indicator.id === id);
};

export const useGetIndicatorsLayerId = (
  id: Indicator["id"],
  locale: string,
  settings: Record<string, unknown>,
  country?: CountryModules,
) => {
  const indicatorData = useGetIndicatorsId(id, locale, country);
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
  type: Exclude<VisualizationTypes, "custom">;
  resource: ResourceFeature;
  geometry: __esri.Polygon | null;
  /** Set when the location is a searched Country, State or Municipality. */
  adminUnit?: AdminUnit | null;
};

const MAX_ADMIN_UNIT_CACHE_ENTRIES = 50;
const adminUnitObjectIdsCache = new Map<string, Promise<(string | number)[]>>();

/**
 * Names can't be compared without accents in the service's SQL, so this reads the unit's
 * country (under 1,000 rows for any layer) and matches the names here. Cached because every
 * widget and the AI summary ask for the same unit.
 */
const getAdminUnitObjectIds = (
  layer: __esri.FeatureLayer,
  hierarchy: HierarchyLayer,
  unit: AdminUnit,
) => {
  const cacheKey = JSON.stringify({ url: layer.url, layerId: layer.layerId, unit });

  const cached = adminUnitObjectIdsCache.get(cacheKey);
  if (cached) return cached;

  const promise = layer
    .queryFeatures({
      where: getCountryWhere(hierarchy, unit),
      outFields: ["*"],
      returnGeometry: false,
    })
    .then((fs) =>
      fs.features
        .filter(({ attributes }) => belongsToAdminUnit(attributes, hierarchy, unit))
        .map(({ attributes }) => attributes[layer.objectIdField] as string | number),
    )
    .catch((error) => {
      adminUnitObjectIdsCache.delete(cacheKey);
      throw error;
    });

  if (adminUnitObjectIdsCache.size >= MAX_ADMIN_UNIT_CACHE_ENTRIES) {
    const oldest = adminUnitObjectIdsCache.keys().next().value;
    if (oldest !== undefined) adminUnitObjectIdsCache.delete(oldest);
  }
  adminUnitObjectIdsCache.set(cacheKey, promise);

  return promise;
};

export const getQueryFeatureId = async (
  { type, resource, geometry, adminUnit }: QueryFeatureIdParams,
  { signal }: { signal?: AbortSignal } = {},
) => {
  const FeatureLayer = (await import("@arcgis/core/layers/FeatureLayer")).default;
  const Query = (await import("@arcgis/core/rest/support/Query")).default;
  const FeatureSet = (await import("@arcgis/core/rest/support/FeatureSet")).default;
  const Graphic = (await import("@arcgis/core/Graphic")).default;

  const f = new FeatureLayer({
    url: resource.url + resource.layer_id,
  });

  const q = resource[`query_${type}`];

  if (q) {
    const query = new Query(q);
    const hierarchy = adminUnit ? getHierarchyLayer(resource.url) : null;

    if (hierarchy && adminUnit) {
      const objectIds = await getAdminUnitObjectIds(f, hierarchy, adminUnit);

      // An empty `objectIds` would lift the filter and return the whole layer.
      if (objectIds.length === 0) {
        if (!isAncestorLayer(hierarchy, adminUnit)) return new FeatureSet({ features: [] });

        const attributes = q.outStatistics
          ? { value: 1 }
          : getAncestorAttributes(hierarchy, adminUnit);

        return new FeatureSet({ features: [new Graphic({ attributes })] });
      }

      query.objectIds = objectIds;
    } else if (geometry) {
      query.geometry = geometry;
    }

    if (q.returnIntersections) {
      query.returnGeometry = true;
    }

    const fs = await f.queryFeatures(query, { signal: getReadSignal(signal) });

    if (q.returnIntersections && fs.geometryType === "polygon") {
      if (!geometry) {
        return null;
      }

      const geometryArea = geodeticAreaOperator.execute(geometry, { unit: "square-kilometers" });

      fs.features.map((f) => {
        if (!f.geometry) return null;

        const intersection = intersectionOperator.execute(f.geometry, geometry);

        if (!intersection) return null;

        f.setAttribute(
          "value",
          geodeticAreaOperator.execute(intersection, { unit: "square-kilometers" }),
        );
        f.setAttribute("total", geometryArea);
      });

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

export const getQueryFeatureIdKey = ({
  id,
  type,
  resource,
  geometry,
  adminUnit,
}: QueryFeatureIdParams) => {
  return ["query-feature", id, type, resource.url, geometry?.toJSON(), adminUnit ?? null];
};

export const getQueryFeatureIdOptions = <
  TData = Awaited<ReturnType<typeof getQueryFeatureId>>,
  TError = unknown,
>(
  params: QueryFeatureIdParams,
  options?: Omit<IndicatorsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getQueryFeatureIdKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getQueryFeatureId>>> = ({ signal }) =>
    getQueryFeatureId(params, { signal });
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

export type QueryFeatureCountParams = {
  id: Indicator["id"];
  resource: ResourceFeature;
  geometry: __esri.Polygon | null;
};

export const getQueryFeatureCount = async (
  { resource, geometry }: QueryFeatureCountParams,
  { signal }: { signal?: AbortSignal } = {},
) => {
  const FeatureLayer = (await import("@arcgis/core/layers/FeatureLayer")).default;

  const f = new FeatureLayer({
    url: resource.url + resource.layer_id,
  });

  return f.queryFeatureCount(
    { ...(!!geometry && { geometry }) },
    { signal: getReadSignal(signal) },
  );
};

export const getQueryFeatureCountKey = ({ id, resource, geometry }: QueryFeatureCountParams) => {
  return ["query-feature-count", id, resource.url, resource.layer_id, geometry?.toJSON()];
};

export const useQueryFeatureCount = (
  params: QueryFeatureCountParams,
  options?: { enabled?: boolean },
) => {
  const queryKey = getQueryFeatureCountKey(params);
  const queryFn: QueryFunction<number> = ({ signal }) => getQueryFeatureCount(params, { signal });

  return useQuery({ queryKey, queryFn, ...options });
};

export type QueryImageryIdParams = {
  id: Indicator["id"];
  type: VisualizationTypes;
  resource: ResourceImagery;
  geometry: __esri.Polygon | null;
};

export const getQueryImageryId = async (
  { resource, geometry }: QueryImageryIdParams,
  { signal }: { signal?: AbortSignal } = {},
): Promise<{
  histograms: __esri.RasterHistogram[];
  statistics: __esri.RasterBandStatistics[];
} | null> => {
  const ImageryLayer = (await import("@arcgis/core/layers/ImageryLayer")).default;
  const f = new ImageryLayer({
    url: resource.url,
  });

  return f.computeStatisticsHistograms(
    { ...(!!geometry && { geometry }) },
    { signal: getReadSignal(signal) },
  );
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
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getQueryImageryId>>> = ({ signal }) =>
    getQueryImageryId(params, { signal });
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

export const getQueryImageryTileId = async (
  { resource, geometry }: QueryImageryTileIdParams,
  { signal }: { signal?: AbortSignal } = {},
): Promise<{
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

  const readSignal = getReadSignal(signal);

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
      signal: readSignal,
    })
    .then((response) => response.data);

  const statistics: {
    histograms: __esri.RasterHistogram[];
    statistics: __esri.RasterBandStatistics[];
  } = await f.computeStatisticsHistograms(
    { ...(!!geometry && { geometry }) },
    { signal: readSignal },
  );

  return {
    RAT,
    ...statistics,
  };
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
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getQueryImageryTileId>>> = ({ signal }) =>
    getQueryImageryTileId(params, { signal });
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
