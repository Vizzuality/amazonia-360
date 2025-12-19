"use client";

import { useCallback } from "react";

import { VisualizationTypes } from "@/types/indicator";

import { useFormTopics } from "@/app/(frontend)/store";

import { Badge } from "@/components/ui/badge";

export function Badges({ topicId, indicatorId }: { topicId: number; indicatorId: number }) {
  const { topics, setTopics } = useFormTopics();

  const topic = topics?.find(({ topic_id }) => topic_id === topicId);
  const indicatorsDisplay = topic?.indicators?.filter(
    ({ indicator_id }) => indicatorId === indicator_id,
  );

  const handleDelete = useCallback(
    (indicatorId: number, type: VisualizationTypes) => {
      setTopics((prev) => {
        if (!prev) return prev;

        const newTopics = [...prev];

        const currentTopic = newTopics.find((t) => t.topic_id === topicId);
        if (!currentTopic) return prev;

        const i = newTopics.findIndex((t) => t.topic_id === topicId);

        if (i === -1) return newTopics;

        newTopics[i] = {
          id: newTopics[i].id,
          topic_id: topicId,
          indicators: newTopics[i]?.indicators?.filter(
            (i) => !(i.indicator_id === indicatorId && i.type === type),
          ),
        };

        return newTopics;
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
