"use client";

import { useMemo } from "react";

import { useQueries } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useLocale } from "next-intl";
import { usePreviousDifferent } from "rooks";

import { useGetAISummary } from "@/lib/ai";
import { getQueryFeatureIdOptions, useGetDefaultIndicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { omit } from "@/lib/utils";

import { ContextLanguage } from "@/types/generated/api.schemas";

import { Indicator } from "@/app/local-api/indicators/route";
import { Topic } from "@/app/local-api/topics/route";
import { AiSummary } from "@/app/parsers";
import {
  isGeneratingAIReportAtom,
  useSyncAiSummary,
  useSyncLocation,
  useSyncTopics,
} from "@/app/store";

import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
}

export const useGetSummaryTopicData = (topic?: Topic, indicators?: Indicator["id"][]) => {
  const locale = useLocale();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);
  const queryIndicators = useGetDefaultIndicators(topic?.id, locale);

  const {
    data: queryIndicatorsData = [],
    isFetching: queryIsFetching,
    isFetched: queryIsFetched,
    isPending: queryIsPending,
  } = queryIndicators;

  const DATA = useMemo(() => {
    return queryIndicatorsData?.filter((indicator) => {
      if (!indicators) return true;
      return indicators.includes(indicator.id);
    });
  }, [indicators, queryIndicatorsData]);

  const QUERIES = useMemo(() => {
    return (
      DATA?.map((indicator) => {
        if (!indicator) return null;
        if (!indicator.resource) return null;

        if (indicator.resource.type === "feature") {
          return getQueryFeatureIdOptions(
            {
              id: indicator.id,
              resource: indicator.resource,
              type: "ai",
              geometry: GEOMETRY,
            },
            {
              enabled: !!GEOMETRY && !!indicator,
            },
          );
        }

        // if (indicator.resource.type === "imagery") {
        //   return {
        //     queryKey: ["imagery", indicator.id],
        //     queryFn: () => Promise.resolve({ features: [] }),
        //   };
        // }

        return null;
      }).filter((q) => !!q) || []
    );
  }, [DATA, GEOMETRY]);

  const queries = useQueries({
    queries: QUERIES,
  });

  const isPending = queries.some((q) => q.isPending) || queryIsPending;
  const isFetched = queries.every((q) => q.isFetched) && queryIsFetched;
  const isFetching = queries.some((q) => q.isFetching) || queryIsFetching;

  return {
    isFetched,
    isFetching,
    isPending,
    data: DATA.map((d, i) => {
      const q = queries[i];

      return {
        name: d[`name_${locale}` as keyof Indicator],
        data:
          q?.data?.features.map((f) =>
            omit(f.attributes, ["Shape__Area", "Shape__Length", "FID", "Id", "OBJECTID"]),
          ) || [],
      };
    }),
  };
};

export const useGetSummaryTopic = (
  topic?: Topic,
  options?: AiSummary,
  activeIndicators?: Indicator["id"][],
) => {
  const locale = useLocale();
  const indicators = options?.only_active ? activeIndicators : undefined;
  const {
    data: indicatorsData,
    isPending: indicatorsIsPending,
    isFetching: indicatorsIsFetching,
    isFetched: indicatorsIsFetched,
  } = useGetSummaryTopicData(topic, indicators);

  const q = useGetAISummary(
    {
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
    },
    {
      enabled: !indicatorsIsPending && indicatorsIsFetched && !indicatorsIsFetching,
    },
  );

  return q;
};

export const ReportResultsSummary = ({ topic }: ReportResultsSummaryProps) => {
  const [topics] = useSyncTopics();
  const activeIndicators = useMemo(() => {
    return topics?.find((t) => t.id === topic?.id)?.indicators?.map(({ id }) => id);
  }, [topic, topics]);
  const previousActiveIndicators = usePreviousDifferent(activeIndicators ?? undefined);

  const [aiSummary, setAiSummary] = useSyncAiSummary();
  const { data, isFetching, isPending } = useGetSummaryTopic(topic, aiSummary, activeIndicators);

  const setIsGeneratingReport = useSetAtom(isGeneratingAIReportAtom);

  useMemo(() => {
    if (!topic) return;
    setIsGeneratingReport((prev) => {
      return {
        ...prev,
        [`${topic?.id}`]: isFetching || isPending,
      };
    });
  }, [topic, isFetching, isPending, setIsGeneratingReport]);

  useMemo(() => {
    if (
      !!previousActiveIndicators &&
      !!activeIndicators &&
      activeIndicators.join("") !== previousActiveIndicators.join("")
    ) {
      setAiSummary((prev) => ({ ...prev, enabled: false }));
    }
  }, [activeIndicators, previousActiveIndicators, setAiSummary]);

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

      {!isFetching && data && !!data.description && (
        <Markdown className="max-w-none xl:prose-base 3xl:prose-lg prose-strong:font-bold">
          {data.description}
        </Markdown>
      )}
    </div>
  );
};
