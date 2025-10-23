"use client";

import { useMemo, useEffect } from "react";

import { useQueries } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { useLocalstorageState, usePreviousDifferent } from "rooks";

import { useGetAISummary } from "@/lib/ai";
import { getQueryFeatureIdOptions, useGetDefaultIndicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn, omit } from "@/lib/utils";

import { ContextDescriptionType, ContextLanguage } from "@/types/generated/api.schemas";
import { Indicator } from "@/types/indicator";
import { Topic } from "@/types/topic";

import { AiSummary } from "@/app/(frontend)/parsers";
import {
  isGeneratingAIReportAtom,
  useSyncAiSummary,
  useSyncLocation,
  useSyncTopics,
} from "@/app/(frontend)/store";

import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
}

export const useGetSummaryTopicData = (topic?: Topic, indicators?: Indicator["id"][]) => {
  const locale = useLocale();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const queryIndicators = useGetDefaultIndicators({
    topicId: topic?.id,
    locale,
  });

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
        name: d.name,
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
  const locale = useLocale();
  const t = useTranslations();

  const [topics] = useSyncTopics();
  const [, setSummary] = useLocalstorageState<string | null>(
    `ai-summary-${topic?.id}-${locale}`,
    null,
  );

  const activeIndicators = useMemo(() => {
    return topics?.find((t) => t.id === topic?.id)?.indicators?.map(({ id }) => id);
  }, [topic, topics]);
  const previousActiveIndicators = usePreviousDifferent(activeIndicators ?? undefined);

  const [aiSummary, setAiSummary] = useSyncAiSummary();
  const { data, isFetching, isPending, isFetched, isError } = useGetSummaryTopic(
    topic,
    aiSummary,
    activeIndicators,
  );

  useEffect(() => {
    if (topic?.id && data?.description && isFetched && !isError) {
      setSummary(data.description);
    } else {
      setSummary(null);
    }
  }, [topic?.id, data?.description, isError, isFetched, setSummary]);

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
      setSummary(null);
    }
  }, [activeIndicators, previousActiveIndicators, setAiSummary, setSummary]);

  return (
    <div className="relative grid grid-cols-12 gap-6">
      {(isPending || isFetching) && (
        <div className="col-span-12 space-y-1.5">
          <p>Generating summary...</p>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      )}

      {!isFetching && data && !!data.description && aiSummary.type && (
        <>
          <div className="relative col-span-12 text-sm font-medium text-muted-foreground lg:col-span-4">
            <Markdown className="prose-sm prose-p:text-muted-foreground lg:sticky lg:top-20">
              {t("report-results-sidebar-ai-summaries-disclaimer", {
                audience: t(
                  `report-results-sidebar-ai-summaries-audience-${aiSummary.type.toLowerCase() as Lowercase<ContextDescriptionType>}-title`,
                ),
              })}
            </Markdown>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <Markdown
              className={cn("max-w-none", {
                "xl:prose-base prose-strong:font-bold": true,
              })}
            >
              {data.description}
            </Markdown>
          </div>
        </>
      )}
    </div>
  );
};
