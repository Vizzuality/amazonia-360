import {
  QueryFunction,
  UseQueryOptions,
  // , useQuery
} from "@tanstack/react-query";
import axios from "axios";

import { useIndicators } from "@/lib/indicators";

import { Topic } from "@/app/api/topics/route";

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
  return axios.get<Topic[]>("/api/topics").then((response) => response.data);
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
