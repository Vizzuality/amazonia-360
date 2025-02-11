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
  () =>
    // options?: Omit<TopicsQueryOptions<TData, TError>, "queryKey">,
    {
      // const { queryKey, queryFn } = getTopicsOptions(options);

      // return useQuery({
      //   queryKey,
      //   queryFn,
      //   ...options,
      // });

      const topics: { [key: number]: Topic } = {};

      const { data: indicatorsData } = useIndicators();

      indicatorsData?.forEach((indicator) => {
        const { topic } = indicator;

        if (!topic.id || !topic.name) {
          return;
        }

        // Initialize the topic if it doesn't exist
        if (!topics[topic.id]) {
          topics[topic.id] = {
            id: topic.id,
            name: topic.name,
            image: `${topic.image}`,
            description: topic.description,
            description_short: topic.description_short,
            indicators: [],
            default_visualization: topic.default_visualization || [],
          };
        }
      });

      Object.keys(topics).forEach((topicId) => {
        const topicItems = indicatorsData?.filter(
          (indicator) => indicator.topic.id === parseInt(topicId),
        );

        topics[parseInt(topicId)].indicators = topicItems?.map((indicator) => ({
          name: indicator.name,
          id: indicator.id,
          description: indicator.description || "",
          description_short: indicator.description_short || "",
          visualization_types: indicator.visualization_types || [],
          default_visualization: indicator.topic.default_visualization || [],
          h3: indicator.h3,
        }));
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

        if (topic.id !== 0 || !topic.name_es) {
          return;
        }

        // Initialize the topic if it doesn't exist
        if (!topics[topic.id]) {
          topics[topic.id] = {
            id: topic.id,
            name: topic.name,
            image: `${topic.image}`,
            description: topic.description,
            description_short: topic.description_short,
            indicators: [],
            default_visualization: topic.default_visualization || [],
          };
        }
      });

      Object.keys(topics).forEach((topicId) => {
        const topicItems = indicatorsData?.filter(
          (indicator) => indicator.topic.id === parseInt(topicId),
        );

        topics[parseInt(topicId)].indicators = topicItems?.map((indicator) => ({
          name: indicator.name,
          id: indicator.id,
          description: indicator.description || "",
          description_short: indicator.description || "",
          visualization_types: indicator.visualization_types || [],
          default_visualization: indicator.topic.default_visualization || [],
        }));
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
