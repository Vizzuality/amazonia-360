import { QueryFunction, useQuery, UseQueryOptions } from "@tanstack/react-query";

import { fetchSubtopics as getSubtopics } from "@/lib/cms-content";

import { Subtopic } from "@/types/topic";

export { getSubtopics };

export type SubtopicsParams = unknown;

export type SubtopicsQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getSubtopics>>,
  TError,
  TData
>;

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
    staleTime: Infinity,
    ...options,
  } as SubtopicsQueryOptions<TData, TError>;
};

export const useGetSubtopics = <TData = Awaited<ReturnType<typeof getSubtopics>>, TError = unknown>(
  locale: string,
  options?: Omit<SubtopicsQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) => {
  const { queryKey, queryFn, staleTime } = getSubtopicsOptions<TData, TError>(locale, options);

  return useQuery({
    queryKey,
    queryFn,
    staleTime,
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
      return data.filter((subtopic) => {
        if (typeof topicId === "number") {
          return subtopic.topic_id === topicId;
        }
        return true;
      });
    },
  });

  return query;
};

export const useGetSubtopicsId = (id: Subtopic["id"], locale: string) => {
  const { data } = useGetSubtopics(locale);

  return data?.find((subtopic) => subtopic.id === id);
};
