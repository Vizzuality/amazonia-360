import { QueryFunction, useQuery, UseQueryOptions } from "@tanstack/react-query";

import { fetchTopics } from "@/lib/cms-content";

import { Topic } from "@/types/topic";

export type TopicsParams = unknown;

export type TopicsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getTopics>>,
  TError,
  TData
>;

export const getTopics = ({ locale }: { locale: string }): Promise<Topic[]> =>
  fetchTopics({ locale });

export const getTopicsKey = (locale: string) => {
  return ["topics", locale];
};

export const getTopicsOptions = <TData = Awaited<ReturnType<typeof getTopics>>, TError = unknown>(
  locale: string,
  options?: Omit<TopicsQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) => {
  const queryKey = getTopicsKey(locale);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTopics>>> = () => getTopics({ locale });

  return {
    queryKey,
    queryFn,
    ...options,
  } as TopicsQueryOptions<TData, TError>;
};

export const useGetTopics = <TData = Awaited<ReturnType<typeof getTopics>>, TError = unknown>(
  locale: string,
  options?: Omit<TopicsQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) => {
  const { queryKey, queryFn } = getTopicsOptions<TData, TError>(locale, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useGetDefaultTopics = ({ locale }: { locale: string }) => {
  const query = useGetTopics(locale, {
    select(data) {
      return data.filter((topic) => topic.id !== 0).sort((a, b) => a.id - b.id);
    },
  });

  return query;
};

export const useGetOverviewTopics = ({ locale }: { locale: string }) => {
  const query = useGetTopics(locale, {
    select(data) {
      return data.filter((topic) => topic.id === 0);
    },
  });

  return query;
};

export const useGetTopicsId = ({ locale, id }: { locale: string; id: Topic["id"] }) => {
  const { data } = useGetTopics(locale);

  return data?.find((topic) => topic.id === id);
};
