import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { collectTopicEvidence, TopicEvidence } from "@/lib/ai/collect";
import { getIndicators, getQueryFeatureId, getQueryImageryId } from "@/lib/indicators";

import { Context, ContextDescriptionType, ContextLanguage } from "@/types/generated/api.schemas";
import { generateDescriptionTextAiPost } from "@/types/generated/text-generation";
import { Indicator } from "@/types/indicator";
import { Topic } from "@/types/topic";

export type AiSummary = {
  type?: ContextDescriptionType;
  only_active?: boolean;
  enabled?: boolean;
  generating?: Record<string, boolean>;
};

export type GetAISummaryParams = Context;

export const getAISummary = (params: GetAISummaryParams) => {
  return generateDescriptionTextAiPost(params);
};

type FetchSummaryTopicDataParams = {
  topic?: Topic;
  indicators?: Indicator["id"][];
  locale: string;
  location: __esri.Polygon | null;
};

const fetchSummaryTopicData = async ({
  topic,
  indicators: indicatorIds,
  locale,
  location,
}: FetchSummaryTopicDataParams): Promise<TopicEvidence> => {
  const allIndicators = await getIndicators(locale);

  const indicators = allIndicators.filter((indicator) => {
    if (topic && indicator.subtopic.topic_id !== topic.id) return false;
    if (indicatorIds && !indicatorIds.includes(indicator.id)) return false;

    return true;
  });

  return collectTopicEvidence(
    { indicators, geometry: location },
    { queryFeature: getQueryFeatureId, queryImagery: getQueryImageryId },
  );
};

export const postSummaryTopic = async (params: {
  topic?: Topic;
  options: AiSummary;
  activeIndicators?: Indicator["id"][];
  locale: string;
  location: __esri.Polygon | null;
}) => {
  const { topic, options, locale, activeIndicators, location } = params;

  const evidence = await fetchSummaryTopicData({
    topic,
    indicators: options?.only_active ? activeIndicators : undefined,
    locale,
    location,
  });

  // Formatting and tone rules live in the API's system prompt (api/src/app/openai_service.py),
  // not here: the client sends measurements, the service decides how to read them.
  const response = await getAISummary({
    data: {
      topic: topic?.name,
      indicators: evidence.indicators,
      indicators_included: evidence.included,
      indicators_total: evidence.total,
    },
    language: locale as ContextLanguage,
    description_type: options?.type,
  });

  return { ...response, included: evidence.included, total: evidence.total };
};

export type GetSummaryTopicCompleteMutationOptions<TData, TError> = UseMutationOptions<
  Awaited<ReturnType<typeof postSummaryTopic>>,
  TError,
  Parameters<typeof postSummaryTopic>[0],
  TData
>;

export const usePostSummaryTopicMutation = <
  TData = Awaited<ReturnType<typeof postSummaryTopic>>,
  TError = unknown,
>(
  options?: Omit<GetSummaryTopicCompleteMutationOptions<TData, TError>, "mutationFn">,
) => {
  return useMutation({
    mutationFn: postSummaryTopic,
    ...options,
  });
};
