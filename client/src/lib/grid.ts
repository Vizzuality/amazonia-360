import {
  QueryFunction,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";

import { gridDatasetMetadataGridMetaGet } from "@/types/generated/grid";

/**
 ************************************************************
 ************************************************************
 * CLIENT ANALYSIS
 * - useGetGridMeta
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
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getGridMeta>>> = () =>
    getGridMeta();
  return { queryKey, queryFn, ...options } as GridMetaQueryOptions<
    TData,
    TError
  >;
};

export const useGetGridMeta = <
  TData = Awaited<ReturnType<typeof getGridMeta>>,
  TError = unknown,
>(
  options?: Omit<GridMetaQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getGridMetaOptions(options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
