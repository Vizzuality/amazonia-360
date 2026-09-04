"use client";

import { useCallback, useMemo } from "react";

import { useTranslations } from "next-intl";
import { useDebounceCallback } from "usehooks-ts";

import { getTopicSummaryStamp, isTopicSummaryStale, useGetTopicSummary } from "@/lib/ai";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { useFormLocation, useFormTopics } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";
import { ForwardRefEditor } from "@/components/ui/editor";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
  editing?: boolean;
  mutation?: ReturnType<typeof useGetTopicSummary>;
  onRegenerate?: () => void;
}

export const ReportResultsSummary = ({
  topic,
  editing,
  mutation,
  onRegenerate,
}: ReportResultsSummaryProps) => {
  const t = useTranslations();
  const { topics, setTopics } = useFormTopics();
  const { location } = useFormLocation();

  const TOPIC = useMemo(() => {
    return topics?.find((t) => t.topic_id === topic?.id);
  }, [topic, topics]);

  const outdated = useMemo(
    () =>
      isTopicSummaryStale(
        TOPIC?.description_stamp,
        getTopicSummaryStamp(
          TOPIC?.indicators?.map(({ indicator_id }) => indicator_id) ?? [],
          location,
        ),
      ),
    [TOPIC, location],
  );

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

  if (mutation?.isIdle && !TOPIC?.description) {
    return null;
  }

  return (
    <div className="relative grid grid-cols-12 gap-6">
      {mutation?.isPending && (
        <div className="col-span-12 space-y-1.5">
          <p>Generating summary...</p>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      )}

      {!mutation?.isPending && TOPIC?.description && (
        <div className="col-span-12 max-w-none xl:max-w-7xl">
          {/*
            Only for a caller that can act on it: `onRegenerate` is withheld from viewers who
            cannot generate, and the whole notice sits behind the same `lg` breakpoint as the
            edit and save buttons, whose popover it opens.
          */}
          {outdated && onRegenerate && (
            <div className="mb-4 hidden flex-wrap items-center gap-x-3 gap-y-2 rounded bg-amber-100 px-3 py-2 lg:flex print:hidden">
              <p className="text-foreground text-sm">
                {t("report-results-sidebar-ai-summaries-outdated")}
              </p>
              <Button variant="outline" size="sm" onClick={onRegenerate}>
                {t("report-results-sidebar-ai-summaries-regenerate")}
              </Button>
            </div>
          )}

          <Markdown
            className={cn({
              hidden: editing,
              "prose prose-base xl:prose-lg 2xl:prose-xl max-w-none": true,
            })}
          >
            {TOPIC.description}
          </Markdown>

          <div
            className={cn({
              hidden: !editing,
            })}
          >
            <ForwardRefEditor markdown={TOPIC.description} onChange={debouncedHandleEditorChange} />
          </div>

          {!!mutation?.data && (
            <p className="text-muted-foreground mt-2 text-xs">
              {t("report-results-sidebar-ai-summaries-coverage", {
                included: mutation.data.included,
                total: mutation.data.total,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
