import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Indicator } from "@/app/api/indicators/route";
/**
 ************************************************************
 ************************************************************
 * INDICATORS
 * - useIndicators
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
