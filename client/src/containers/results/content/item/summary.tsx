"use client";

import { useCallback, useMemo } from "react";

import { useDebounceCallback } from "usehooks-ts";

import { usePostSummaryTopicMutation } from "@/lib/ai";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { useSyncTopics } from "@/app/(frontend)/store";

import { ForwardRefEditor } from "@/components/ui/editor";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportResultsSummaryProps {
  topic?: Topic;
  editing?: boolean;
  mutation?: ReturnType<typeof usePostSummaryTopicMutation>;
}

export const ReportResultsSummary = ({ topic, editing, mutation }: ReportResultsSummaryProps) => {
  const { topics, setTopics } = useSyncTopics();

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
        <div className="col-span-12 space-y-1.5">
          <p>Generating summary...</p>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      )}

      {!mutation?.isPending && TOPIC?.description && (
        <div className="col-span-12 max-w-none xl:max-w-7xl">
          <Markdown
            className={cn({
              hidden: editing,
              "prose prose-base max-w-none xl:prose-lg 2xl:prose-xl": true,
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
        </div>
      )}
    </div>
  );
};
