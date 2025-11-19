"use client";

import { useCallback, useMemo } from "react";

import { useTranslations } from "next-intl";
import { useDebounceCallback } from "usehooks-ts";

import { ContextDescriptionType } from "@/types/generated/api.schemas";
import { Topic } from "@/types/topic";

import { useSyncAiSummary, useSyncTopics } from "@/app/(frontend)/store";

import { ForwardRefEditor } from "@/components/ui/editor";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
}

export const ReportResultsSummary = ({ topic }: ReportResultsSummaryProps) => {
  const t = useTranslations();
  const [topics, setTopics] = useSyncTopics();
  const [aiSummary] = useSyncAiSummary();

  const TOPIC = useMemo(() => {
    return topics?.find((t) => t.topic_id === topic?.id);
  }, [topic, topics]);

  console.log(TOPIC);

  const handleEditorChange = useCallback(
    (markdown: string) => {
      if (!topic) return;

      setTopics((prevTopics) => {
        if (!prevTopics) return prevTopics;

        return prevTopics.map((t) => {
          if (t.topic_id === topic.id) {
            return {
              ...t,
              description: markdown,
            };
          }
          return t;
        });
      });
    },
    [topic, setTopics],
  );

  const debouncedHandleEditorChange = useDebounceCallback(handleEditorChange, 500);

  if (!aiSummary.generating?.[topic?.id as number] && !TOPIC?.description) {
    return null;
  }

  return (
    <div className="relative grid grid-cols-12 gap-6">
      {aiSummary.generating?.[topic?.id as number] && (
        <div className="col-span-12 space-y-1.5">
          <p>Generating summary...</p>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      )}

      {!aiSummary.generating?.[topic?.id as number] && TOPIC?.description && (
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
            <ForwardRefEditor markdown={TOPIC.description} onChange={debouncedHandleEditorChange} />
          </div>
        </>
      )}
    </div>
  );
};
