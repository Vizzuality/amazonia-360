import { QueryFunction, useQuery, UseQueryOptions } from "@tanstack/react-query";

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

export type TranslatedTopic = Omit<
  Topic,
  "name_en" | "name_sp" | "name_pt" | "description_en" | "description_sp" | "description_pt"
> & {
  topic_name: string;
  topic_description: string;
};

export type TopicsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getTopics>>,
  TError,
  TData
>;

export const getTopics = async ({ locale }: { locale: string }): Promise<TranslatedTopic[]> => {
  const topics = TOPICS as Topic[];

  const topicsTranslated: TranslatedTopic[] = topics.map((topic) => {
    return {
      id: topic.id,
      image: topic.image,
      default_visualization: topic.default_visualization,
      topic_name: topic[`name_${locale}` as keyof Topic] as string,
      topic_description: topic[`description_${locale}` as keyof Topic] as string,
    };
  });

  return topicsTranslated;
};

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

export const useGetTopicsId = (id: Topic["id"], locale: string) => {
  const { data } = useGetTopics(locale);

  return data?.find((topic) => topic.id === id);
};
