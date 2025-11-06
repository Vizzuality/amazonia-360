import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { getIndicators, getQueryFeatureId } from "@/lib/indicators";

import { Context, ContextLanguage } from "@/types/generated/api.schemas";
import { generateDescriptionTextAiPost } from "@/types/generated/text-generation";
import { Indicator, ResourceFeature } from "@/types/indicator";
import { Topic } from "@/types/topic";

import { AiSummary } from "@/app/(frontend)/parsers";

export type GetAISummaryParams = Context;

export const getAISummary = (params: GetAISummaryParams) => {
  return generateDescriptionTextAiPost(params);
};

export type FetchSummaryTopicDataParams = {
  topic?: Topic;
  indicators?: Indicator["id"][];
  locale: string;
  location: __esri.Polygon | null;
};

const fetchSummaryTopicData = async (
  params: FetchSummaryTopicDataParams,
): Promise<Record<string, unknown>[]> => {
  const { topic, indicators: indicatorIds, locale, location } = params;

  try {
    // 1. Get geometry from location (assuming it's a proper Polygon geometry)
    const GEOMETRY = location;

    // 2. Fetch default indicators for the topic
    const allIndicators = await getIndicators(locale);

    // Filter indicators based on topic and resource type
    const queryIndicatorsData = allIndicators.filter((indicator) => {
      // Filter by topic if provided
      if (topic) {
        const hasTopicMatch = indicator.subtopic.topic_id === topic.id;
        if (!hasTopicMatch) return false;
      }

      // Filter by specific indicator IDs if provided
      if (indicatorIds) {
        const hasIndicatorMatch = indicatorIds.includes(indicator.id);
        if (!hasIndicatorMatch) return false;
      }

      // Only include indicators with feature resources (for data querying)
      return indicator.resource.type === "feature";
    });

    // 3. Create and execute queries for each indicator
    const indicatorPromises = queryIndicatorsData.map(async (indicator) => {
      if (!indicator || !indicator.resource || indicator.resource.type !== "feature") {
        return null;
      }

      try {
        // Use the existing getQueryFeatureId infrastructure
        const featureSet = await getQueryFeatureId({
          id: indicator.id,
          type: "chart", // Default visualization type for data fetching
          resource: indicator.resource as ResourceFeature, // Type assertion for resource compatibility
          geometry: GEOMETRY,
        });

        if (!featureSet || !featureSet.features) {
          return {
            id: indicator.id,
            name: indicator.name,
            data: [],
          };
        }

        // Process the feature data into a usable format
        const processedData = featureSet.features.map((feature) => ({
          attributes: feature.attributes,
          value: feature.attributes.value || 0,
          label: feature.attributes.label || feature.attributes.name || "Unknown",
        }));

        return {
          id: indicator.id,
          name: indicator.name,
          data: processedData,
          total: featureSet.features.length,
        };
      } catch (error) {
        console.error(`Error fetching data for indicator ${indicator.id}:`, error);
        return {
          id: indicator.id,
          name: indicator.name,
          data: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // 4. Wait for all queries to complete and filter out null results
    const results = await Promise.all(indicatorPromises);
    const filteredResults = results.filter((result) => result !== null);

    return filteredResults;
  } catch (error) {
    console.error("Error fetching summary topic data:", error);
    return [];
  }
};

// Enhanced mutation for summary topic that fetches all data internally
export const postSummaryTopic = async (params: {
  topic?: Topic;
  options: AiSummary;
  activeIndicators?: Indicator["id"][];
  locale: string;
  location: __esri.Polygon | null;
}) => {
  const { topic, options, locale, activeIndicators, location } = params;

  // First, fetch the indicators data internally
  const indicators = options?.only_active ? activeIndicators : undefined;

  const indicatorsData = await fetchSummaryTopicData({
    topic,
    indicators,
    locale,
    location,
  });

  // Then generate the AI summary with the fetched data
  return getAISummary({
    data: {
      indicators: indicatorsData,
      topic: topic?.name,
      ai_notes: [
        "Don't use blockquotes",
        "Don't use headings",
        "Don't use lists",
        "Don't use tables",
        "Don't use images",
        "Don't use links",
        "Don't use code blocks",
        "Don't use horizontal rules",
        "Don't use footnotes",
        "Try to emphasize the most important information by putting in bold",
        "Try to use percentages every time is possible",
      ],
    },
    language: locale as ContextLanguage,
    description_type: options?.type,
  });
};

// Update the mutation to use the complete version
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
