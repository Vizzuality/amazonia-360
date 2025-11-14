"use client";

import { useCallback } from "react";

import { VisualizationTypes } from "@/types/indicator";

import { useSyncTopics } from "@/app/(frontend)/store";

import { Badge } from "@/components/ui/badge";

export function Badges({ topicId, indicatorId }: { topicId: number; indicatorId: number }) {
  const [topics, setTopics] = useSyncTopics();

  const topic = topics?.find(({ topic_id }) => topic_id === topicId);
  const indicatorsDisplay = topic?.indicators?.filter(
    ({ indicator_id }) => indicatorId === indicator_id,
  );

  const handleDelete = useCallback(
    (indicatorId: number, type: VisualizationTypes) => {
      setTopics((prev) => {
        if (!prev) return prev;

        const currentTopic = prev.find((t) => t.topic_id === topicId);
        if (!currentTopic) return prev;

        const i = prev.findIndex((t) => t.topic_id === topicId);

        if (i === -1) return prev;

        prev[i] = {
          id: prev[i].id,
          topic_id: topicId,
          indicators: prev[i]?.indicators?.filter(
            (i) => !(i.indicator_id === indicatorId && i.type === type),
          ),
        };

        return prev;
      });
    },
    [topicId, setTopics],
  );

  return (
    <div className="mt-0.5 flex flex-wrap gap-1">
      {indicatorsDisplay?.map(({ indicator_id, type }) => (
        <Badge
          onClick={() => handleDelete(indicator_id, type)}
          variant="secondary"
          className="capitalize"
          key={type}
        >
          {type}
        </Badge>
      ))}
    </div>
  );
}
