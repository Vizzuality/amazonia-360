import { QueryFunction, useQuery, UseQueryOptions } from "@tanstack/react-query";

import { Context } from "@/types/generated/api.schemas";
import { generateDescriptionTextAiPost } from "@/types/generated/text-generation";

export type GetAISummaryParams = Context;

export type GetAISummaryQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getAISummary>>,
  TError,
  TData
>;

export const getAISummary = (params: GetAISummaryParams) => {
  return generateDescriptionTextAiPost(params);
};

export const getAISummaryKey = (params: GetAISummaryParams) => {
  return ["summary", JSON.stringify(params)];
};

export const getAISummaryOptions = <
  TData = Awaited<ReturnType<typeof getAISummary>>,
  TError = unknown,
>(
  params: GetAISummaryParams,
  options?: Omit<GetAISummaryQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getAISummaryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getAISummary>>> = () =>
    getAISummary(params);
  return { queryKey, queryFn, ...options } as GetAISummaryQueryOptions<TData, TError>;
};

export const useGetAISummary = <TData = Awaited<ReturnType<typeof getAISummary>>, TError = unknown>(
  params: GetAISummaryParams,
  options?: Omit<GetAISummaryQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getAISummaryOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
