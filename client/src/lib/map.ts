import Basemap from "@arcgis/core/Basemap";
import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { BasemapIds } from "@/constants/basemaps";

/**
 ************************************************************
 ************************************************************
 * Get Basemap
 ************************************************************
 ************************************************************
 */
export type GetBasemapParams = {
  id?: BasemapIds;
};
export const getBasemap = async (params: GetBasemapParams) => {
  const { id } = params;

  if (!id) {
    throw new Error("id is required");
  }

  return Basemap.fromId(id)
    .load()
    .then((basemap) => {
      const b = basemap as Basemap;
      return b.clone();
    });
};

export const getBasemapKey = (params: GetBasemapParams) => {
  const { id } = params;
  return ["arcgis", "basemap", id] as const;
};

export const getBasemapOptions = <TData = Awaited<ReturnType<typeof getBasemap>>, TError = unknown>(
  params: GetBasemapParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getBasemap>>, TError, TData>,
    "queryKey"
  >,
) => {
  const queryKey = getBasemapKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getBasemap>>> = () => getBasemap(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getBasemap>>,
    TError,
    TData
  >;
};

export const useGetBasemap = <TData = Awaited<ReturnType<typeof getBasemap>>, TError = unknown>(
  params: GetBasemapParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getBasemap>>, TError, TData>,
    "queryKey"
  >,
) => {
  const { queryKey, queryFn } = getBasemapOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
