import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";

import {
  BodyReadTableGridTablePost,
  ReadTableGridTablePostParams,
  GridDatasetMetadataInAreaGridMetaPostParams,
  Feature,
} from "@/types/generated/api.schemas";
import {
  gridDatasetMetadataGridMetaGet,
  readTableGridTablePost,
  gridDatasetMetadataInAreaGridMetaPost,
} from "@/types/generated/grid";

import { API } from "@/services/api";

/**
 ************************************************************
 ************************************************************
 * GRID
 * - useGetGridMeta
 * - useGetGridTable
 ************************************************************
 ************************************************************
 */
export type GetGridMetaParams = unknown;

export interface MultiDatasetMeta {
  datasets: Array<{
    var_name: string;
    var_dtype: string;
    label: string;
    nodata: number | null;
    description: string;
    unit: string;
    legend: {
      legend_type: "continuous" | "categorical";
      colormap_name: string;
      stats: Array<{
        level: number;
        min: number;
        max: number;
      }>;
    };
  }>;
}

export type GridMetaQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getGridMeta>>,
  TError,
  TData
>;

export const getGridMeta = async () => {
  return gridDatasetMetadataGridMetaGet();
};

export const getGridMetaFromGeometryOptions = <TData = MultiDatasetMeta, TError = unknown>(
  feature: Feature,
  params: GridDatasetMetadataInAreaGridMetaPostParams,
  options?: Omit<GridMetaQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = ["gridMetaFromGeometry", feature, params];
  const queryFn: QueryFunction<TData> = () =>
    gridDatasetMetadataInAreaGridMetaPost(feature, params) as Promise<TData>;

  return { queryKey, queryFn, ...options } as GridMetaQueryOptions<TData, TError>;
};

export const getGridMetaKey = () => {
  return ["grid", "meta"];
};

export const getGridMetaOptions = <
  TData = Awaited<ReturnType<typeof getGridMeta>>,
  TError = unknown,
>(
  options?: Omit<GridMetaQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getGridMetaKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getGridMeta>>> = () => getGridMeta();
  return { queryKey, queryFn, ...options } as GridMetaQueryOptions<TData, TError>;
};

export const useGetGridMeta = <TData = Awaited<ReturnType<typeof getGridMeta>>, TError = unknown>(
  options?: Omit<GridMetaQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getGridMetaOptions(options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const getGridMetaFromGeometry = async (
  feature: Feature,
  params: GridDatasetMetadataInAreaGridMetaPostParams,
) => {
  return API({
    url: `/grid/meta`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: feature,
    params,
  });
};

export const useGetGridMetaFromGeometry = <
  TData = Awaited<ReturnType<typeof gridDatasetMetadataInAreaGridMetaPost>>,
  TError = unknown,
>(
  feature: Feature,
  params: GridDatasetMetadataInAreaGridMetaPostParams,
  options?: Omit<GridMetaQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getGridMetaFromGeometryOptions(feature, params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export type GetGridTableParams = {
  body: BodyReadTableGridTablePost;
  params: ReadTableGridTablePostParams;
};

export type GridTableQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getGridTable>>,
  TError,
  TData
>;

export const getGridTable = async (params: GetGridTableParams) => {
  return readTableGridTablePost(params.body, params.params);
};

export const getGridTableKey = (params: GetGridTableParams) => {
  return ["grid", "table", params.params, params.body];
};

export const getGridTableOptions = <
  TData = Awaited<ReturnType<typeof getGridTable>>,
  TError = unknown,
>(
  params: GetGridTableParams,
  options?: Omit<GridTableQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getGridTableKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getGridTable>>> = () =>
    getGridTable(params);
  return { queryKey, queryFn, ...options } as GridTableQueryOptions<TData, TError>;
};

export const useGetGridTable = <TData = Awaited<ReturnType<typeof getGridTable>>, TError = unknown>(
  params: GetGridTableParams,
  options?: Omit<GridTableQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getGridTableOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
