"use client";

import { useQueries } from "@tanstack/react-query";

import { useGetAISummary } from "@/lib/ai";
import { getQueryFeatureIdOptions, useGetDefaultIndicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Topic } from "@/app/local-api/topics/route";
import { useSyncLocation } from "@/app/store";

import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
}

export const useGetSummaryTopicData = (topic?: Topic) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);
  const queryIndicators = useGetDefaultIndicators(topic?.id);

  const { data: queryIndicatorsData } = queryIndicators;

  const queries = useQueries({
    queries:
      queryIndicatorsData
        ?.map((indicator) => {
          if (!indicator) return null;
          if (!indicator.resource) return null;

          if (indicator.resource.type === "feature") {
            return getQueryFeatureIdOptions(
              {
                id: indicator.id,
                resource: {
                  ...indicator.resource,
                  query_chart: null,
                  query_map: null,
                  query_numeric: null,
                  query_table: {
                    returnGeometry: true,
                    returnIntersections: true,
                  },
                },
                type: "table",
                geometry: GEOMETRY,
              },
              {
                enabled: !!GEOMETRY && !!indicator,
              },
            );
          }

          return null;
        })
        .filter((q) => !!q) || [],
  });

  const isFetched = queries.every((q) => q.isFetched);
  const isFetching = queries.some((q) => q.isFetching);

  return {
    isFetched,
    isFetching,
    data: queries.map((q) => {
      if (q.data?.features) {
        return q.data.features.map((f) => f.attributes);
      }

      return [];
    }),
  };
};

export const useGetSummaryTopic = (topic?: Topic) => {
  const {
    data: indicatorsData,
    isFetching: indicatorsIsFetching,
    isFetched: indicatorsIsFetched,
  } = useGetSummaryTopicData(topic);

  const q = useGetAISummary(
    {
      data: {
        indicators: indicatorsData,
        topic: topic?.name_en,
        ai_notes: [
          "Don't use blockquotes",
          "Don't use headings",
          "Try to emphasize the most important information by putting in bold",
        ],
      },
      language: "en",
      description_type: "Short",
    },
    {
      enabled: indicatorsIsFetched && !indicatorsIsFetching,
    },
  );

  return q;
};

export const ReportResultsSummary = ({ topic }: ReportResultsSummaryProps) => {
  const { data, isFetching, isFetched, isPending } = useGetSummaryTopic(topic);

  return (
    <div className="relative">
      {(isPending || isFetching) && (
        <div className="space-y-1.5">
          <p>Generating summary...</p>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      )}

      {isFetched && !isFetching && data && !!data.description && (
        <Markdown className="max-w-none">{data.description}</Markdown>
      )}
    </div>
  );
};
