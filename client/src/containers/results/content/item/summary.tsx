"use client";

import { useCallback, useMemo } from "react";

import { RefreshCw, SearchX, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDebounceCallback } from "usehooks-ts";

import { AISummaryTimeoutError, useGetTopicSummary } from "@/lib/ai";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { useFormTopics } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";
import { ForwardRefEditor } from "@/components/ui/editor";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
  editing?: boolean;
  mutation?: ReturnType<typeof useGetTopicSummary>;
}

export const ReportResultsSummary = ({ topic, editing, mutation }: ReportResultsSummaryProps) => {
  const t = useTranslations();
  const { topics, setTopics } = useFormTopics();

  const TOPIC = useMemo(() => {
    return topics?.find((t) => t.topic_id === topic?.id);
  }, [topic, topics]);

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
        <div className="col-span-12 space-y-1.5" data-testid="ai-summary-generating">
          <p>{t("ai-summary-generating")}</p>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      )}

      {mutation?.isError && (
        <div className="col-span-12 space-y-2" data-testid="ai-summary-error">
          <div
            role="alert"
            className="border-destructive flex gap-3 rounded-md border bg-red-50 px-4 py-3 text-sm"
          >
            <TriangleAlert className="text-destructive mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="text-destructive font-medium">{t("ai-summary-error-title")}</p>
              <p className="text-muted-foreground">
                {t(
                  mutation.error instanceof AISummaryTimeoutError
                    ? "ai-summary-error-timeout"
                    : "ai-summary-error-generic",
                )}
              </p>
            </div>
          </div>
          {!!mutation.variables && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => mutation.variables && mutation.mutate(mutation.variables)}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              <span>{t("ai-summary-generate-again")}</span>
            </Button>
          )}
        </div>
      )}

      {mutation?.data?.status === "no_data" && (
        <div
          className="col-span-12 flex gap-3 rounded-md border px-4 py-3 text-sm"
          data-testid="ai-summary-no-data"
        >
          <SearchX className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium text-blue-900">{t("ai-summary-no-data-title")}</p>
            <p className="text-muted-foreground">{t("ai-summary-no-data-description")}</p>
          </div>
        </div>
      )}

      {!mutation?.isPending && TOPIC?.description && (
        <div className="col-span-12 max-w-none xl:max-w-7xl">
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

          {mutation?.data?.status === "ok" && (
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
