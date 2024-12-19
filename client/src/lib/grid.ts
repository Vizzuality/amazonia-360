import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";

import {
  BodyReadTableGridTablePost,
  ReadTableGridTablePostParams,
} from "@/types/generated/api.schemas";
import { gridDatasetMetadataGridMetaGet, readTableGridTablePost } from "@/types/generated/grid";

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

export type GridMetaQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getGridMeta>>,
  TError,
  TData
>;

export const getGridMeta = async () => {
  return gridDatasetMetadataGridMetaGet();
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
