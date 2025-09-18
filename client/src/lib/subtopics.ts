import { QueryFunction, useQuery, UseQueryOptions } from "@tanstack/react-query";

import { Subtopic } from "@/types/topic";

import SUBTOPICS from "@/../datum/subtopics.json";

/**
 ************************************************************
 ************************************************************
 * topicsData
 * - useGetSubtopics
 * - useGetSubtopicId
 ************************************************************
 ************************************************************
 */
export type SubtopicsParams = unknown;

export type SubtopicsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getSubtopics>>,
  TError,
  TData
>;

export const getSubtopics = async ({ locale }: { locale: string }): Promise<Subtopic[]> => {
  const subtopics = SUBTOPICS as Subtopic[];

  const topicsTranslated: Subtopic[] = subtopics.map((subtopic) => {
    return {
      ...subtopic,
      name: subtopic[`name_${locale}` as keyof Subtopic] as string,
      description: subtopic[`description_${locale}` as keyof Subtopic] as string,
    };
  });

  return topicsTranslated;
};

export const getSubtopicsKey = (locale: string) => {
  return ["subtopics", locale];
};

export const getSubtopicsOptions = <
  TData = Awaited<ReturnType<typeof getSubtopics>>,
  TError = unknown,
>(
  locale: string,
  options?: Omit<SubtopicsQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) => {
  const queryKey = getSubtopicsKey(locale);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getSubtopics>>> = () =>
    getSubtopics({ locale });

  return {
    queryKey,
    queryFn,
    ...options,
  } as SubtopicsQueryOptions<TData, TError>;
};

export const useGetSubtopics = <TData = Awaited<ReturnType<typeof getSubtopics>>, TError = unknown>(
  locale: string,
  options?: Omit<SubtopicsQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) => {
  const { queryKey, queryFn } = getSubtopicsOptions<TData, TError>(locale, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useGetDefaultSubtopics = ({
  topicId,
  locale,
}: {
  topicId?: number;
  locale: string;
}) => {
  const query = useGetSubtopics(locale, {
    select(data) {
      return data
        .filter((subtopic) => {
          if (typeof topicId === "number") {
            return subtopic.topic_id === topicId;
          }
          return true;
        })
        .sort((a, b) => a.id - b.id);
    },
  });

  return query;
};

export const useGetSubtopicsId = (id: Subtopic["id"], locale: string) => {
  const { data } = useGetSubtopics(locale);

  return data?.find((subtopic) => subtopic.id === id);
};
