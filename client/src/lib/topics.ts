import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Indicator } from "@/app/api/indicators/route";
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

export const useGetTopics = <TData = Awaited<ReturnType<typeof getTopics>>, TError = unknown>(
  options?: Omit<TopicsQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getTopicsOptions(options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useGetTopicsId = (id: Topic["id"]) => {
  const { data } = useGetTopics();

  return data?.find((topic) => topic.id === id);
};

export const useGetTopicsFromIndicators = (indicators: Indicator[] | undefined): Topic[] | null => {
  const topics: { [key: number]: Topic } = {};

  if (!indicators?.length) return null;

  indicators?.forEach((indicator) => {
    const { topic_id, topic_name } = indicator;

    if (!topic_id || !topic_name) {
      return;
    }

    // Initialize the topic if it doesn't exist
    if (!topics[topic_id]) {
      topics[topic_id] = {
        id: topic_id,
        name: topic_name,
        image: `/images/topics/${topic_name.toLowerCase().replace(/ /g, "-")}.png`,
        description: "",
        indicators: [],
        default_visualization: [],
      };
    }
  });

  Object.keys(topics).forEach((topicId) => {
    const topicItems = indicators.filter((indicator) => indicator.topic_id === parseInt(topicId));

    topics[parseInt(topicId)].indicators = topicItems.map((indicator) => ({
      name: indicator.name,
      id: indicator.id,
      visualization_types: indicator.visualization_types || [],
      default_visualization: indicator.default_visualization || [],
    }));
  });

  return Object.values(topics);
};
