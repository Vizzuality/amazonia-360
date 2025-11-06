"use client";

import { useMemo } from "react";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { ContextDescriptionType } from "@/types/generated/api.schemas";
import { Topic } from "@/types/topic";

import { useSyncAiSummary, useSyncTopics } from "@/app/(frontend)/store";

import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
}

export const ReportResultsSummary = ({ topic }: ReportResultsSummaryProps) => {
  const t = useTranslations();
  const [topics] = useSyncTopics();
  const [aiSummary] = useSyncAiSummary();

  const TOPIC = useMemo(() => {
    return topics?.find((t) => t.id === topic?.id);
  }, [topic, topics]);

  // Check if AI is enabled and generating
  const isGenerating = aiSummary.enabled;
  const hasData = TOPIC?.description && aiSummary.type;

  return (
    <div className="relative grid grid-cols-12 gap-6">
      {isGenerating && !hasData && (
        <div className="col-span-12 space-y-1.5">
          <p>Generating summary...</p>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      )}

      {hasData && (
        <>
          <div className="relative col-span-12 text-sm font-medium text-muted-foreground lg:col-span-4">
            <Markdown className="prose-sm prose-p:text-muted-foreground lg:sticky lg:top-20">
              {t("report-results-sidebar-ai-summaries-disclaimer", {
                audience: t(
                  `report-results-sidebar-ai-summaries-audience-${(aiSummary.type || "").toLowerCase() as Lowercase<ContextDescriptionType>}-title`,
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
              {TOPIC.description}
            </Markdown>
          </div>
        </>
      )}
    </div>
  );
};
