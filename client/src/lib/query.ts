import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Query from "@arcgis/core/rest/support/Query";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { omit } from "@/lib/utils";

/**
 ************************************************************
 ************************************************************
 * Get Features
 ************************************************************
 ************************************************************
 */
export type GetFeaturesParams = {
  query?: Query;
  feature?: Partial<__esri.FeatureLayer> | null;
};
export const getFeatures = async (params: GetFeaturesParams) => {
  const { feature, query } = params;

  if (!feature || !query) {
    throw new Error("Feature and query are required");
  }

  const f = new FeatureLayer(omit(feature, ["type"]));
  const q = query.clone();

  return f!.queryFeatures(q);
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
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFeatures>>> = () => getFeatures(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getFeatures>>,
    TError,
    TData
  >;
};

export const useGetFeatures = <TData = Awaited<ReturnType<typeof getFeatures>>, TError = unknown>(
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

  const f = new FeatureLayer(omit(feature, ["type"]));
  const q = query.clone();

  q!.where = `FID = ${params.id}`;

  return f!.queryFeatures(q);
};

export const getFeaturesIdKey = (params: GetFeaturesIdParams) => {
  const { feature, query } = params;
  return ["arcgis", "query", params.id, feature?.id, query?.toJSON() ?? {}] as const;
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
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFeaturesId>>> = () =>
    getFeaturesId(params);
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
 * Metadata
 ************************************************************
 ************************************************************
 */
export type GetMetadataParams = {
  id: number;
  url: string;
};

export type MetadataQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getMetadata>>,
  TError,
  TData
>;

export const getMetadata = async (params: GetMetadataParams) => {
  const { id, url } = params;

  if (!id) {
    throw new Error("id is required");
  }
  if (!url) {
    return Promise.resolve({
      id,
      metadata: "",
    });
  }

  const response = await axios.get(url, {
    headers: {
      "Content-Type": "application/xml",
    },
  });

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(response.data, "text/xml");
  const metadataElement = xmlDoc.getElementsByTagName("idAbs")[0];

  return {
    id,
    metadata: metadataElement?.textContent || "",
  };
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
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getMetadata>>> = () => getMetadata(params);
  return { queryKey, queryFn, ...options } as MetadataQueryOptions<TData, TError>;
};

export const useGetMetadata = <TData = Awaited<ReturnType<typeof getMetadata>>, TError = unknown>(
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
