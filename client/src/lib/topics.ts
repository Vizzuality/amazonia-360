import { QueryFunction, UseQueryOptions } from "@tanstack/react-query";

import { useGetIndicatorsOverview, useIndicators } from "@/lib/indicators";

import { Topic } from "@/app/local-api/topics/route";
import TOPICS from "@/app/local-api/topics/topics.json";

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
    const topics: { [key: number]: Topic } = {};

    const { data: indicatorsData } = useIndicators();

    indicatorsData?.forEach((indicator) => {
      const { topic } = indicator;

      if (!topic?.id) {
        return;
      }

      // Initialize the topic if it doesn't exist
      if (!topics[topic.id]) {
        if (typeof topic !== "number") {
          const t = topic as Topic;
          topics[t.id] = {
            ...t,
            indicators: [],
          };
        }
      }
    });

    Object.keys(topics).forEach((topicId) => {
      topics[parseInt(topicId)].indicators = indicatorsData?.filter(
        (indicator) => indicator.topic.id === parseInt(topicId),
      );
    });

    return {
      data: Object.values(topics),
      isLoading: false,
    };
  };

export const getTopicsOverview = async () => {
  const topics = TOPICS as Topic[];
  return topics;
};

export const getTopicsOverviewKey = () => {
  return ["topics-overview"];
};

export const getTopicsOverviewOptions = <
  TData = Awaited<ReturnType<typeof getTopicsOverview>>,
  TError = unknown,
>(
  options?: Omit<TopicsQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getTopicsOverviewKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTopicsOverview>>> = () =>
    getTopicsOverview();
  return { queryKey, queryFn, ...options } as TopicsQueryOptions<TData, TError>;
};

export const useGetTopicsOverview =
  // <TData = Awaited<ReturnType<typeof getTopicsOverview>>, TError = unknown>
  () =>
    // options?: Omit<TopicsQueryOptions<TData, TError>, "queryKey">,
    {
      // const { queryKey, queryFn } = getTopicsOverviewOptions(options);

      // return useQuery({
      //   queryKey,
      //   queryFn,
      //   ...options,
      // });

      const topics: { [key: number]: Topic } = {};

      const { data: indicatorsData } = useGetIndicatorsOverview();
      indicatorsData?.forEach((indicator) => {
        const { topic } = indicator;

        if (topic?.id !== 0) {
          return;
        }

        // Initialize the topic if it doesn't exist
        if (!topics[topic.id]) {
          if (typeof topic !== "number") {
            const t = topic as Topic;
            topics[t.id] = {
              ...t,
              indicators: [],
            };
          }
        }
      });

      Object.keys(topics).forEach((topicId) => {
        topics[parseInt(topicId)].indicators = indicatorsData?.filter(
          (indicator) => indicator.topic.id === parseInt(topicId),
        );
      });

      return {
        data: Object.values(topics),
        isLoading: false,
      };
    };

export const useGetTopicsId = (id: Topic["id"]) => {
  const { data } = useGetTopics();

  return data?.find((topic) => topic.id === id);
};
