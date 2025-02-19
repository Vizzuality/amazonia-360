import { QueryFunction, UseQueryOptions } from "@tanstack/react-query";

import { useIndicators } from "@/lib/indicators";

import { Topic } from "@/app/local-api/topics/route";
import TOPICS from "@/app/local-api/topics/topics_v17_02_2025.json";

/**
 ************************************************************
 ************************************************************
 * topicsData
 * - useGetTopics
 * - useGetTopicId
 ************************************************************
 ************************************************************
 */
export type TopicsParams = unknown;

export type TopicsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getTopics>>,
  TError,
  TData
>;

export const getTopics = async () => {
  const topics = TOPICS as Topic[];
  return topics;
};

export const getTopicsKey = () => {
  return ["topics"];
};

export const getTopicsOptions = <TData = Awaited<ReturnType<typeof getTopics>>, TError = unknown>(
  options?: Omit<TopicsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getTopicsKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTopics>>> = () => getTopics();
  return { queryKey, queryFn, ...options } as TopicsQueryOptions<TData, TError>;
};

export const useGetTopics =
  // <TData = Awaited<ReturnType<typeof getTopics>>, TError = unknown>
  () => {
    const { data: indicatorsData } = useIndicators();

    // get an unique array of topics based on the indicators using reduce
    const topics = indicatorsData?.reduce((acc, indicator) => {
      if (indicator.topic && !acc.find((topic) => topic.id === indicator.topic.id)) {
        acc.push(indicator.topic);
      }
      return acc;
    }, [] as Topic[]);

    return {
      data: topics,
      isLoading: false,
    };
  };

export const useGetTopicsId = (id: Topic["id"]) => {
  const { data } = useGetTopics();

  return data?.find((topic) => topic.id === id);
};
