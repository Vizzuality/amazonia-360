"use client";

import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, TOPICS, Topic } from "@/constants/topics";

import TopicsItem from "@/containers/report/topics/item";

import { VisualizationType } from "../visualization-types/types";

export interface TopicsProps {
  interactive?: boolean;
  size: "sm" | "md" | "lg";
}

export default function Topics({ interactive = true, size = "md" }: TopicsProps) {
  const [topics, setTopics] = useSyncTopics();

  const handleTopicChange = (topic: Topic, checked: boolean) => {
    if (checked) {
      setTopics((prev) => {
        return prev?.filter((t) => t.id !== topic.id) || [];
      });
    } else {
      const T = {
        id: topic.id,
        indicators:
          topic.default_indicators
            ?.map((indicatorValue) => {
              const indicator = topic.indicators?.find((ind) => ind.value === indicatorValue);
              return {
                id: indicator?.value || "",
                type: indicator?.types_available?.[0] as VisualizationType,
                size: DEFAULT_VISUALIZATION_SIZES[indicator?.types_available?.[0] || "map"],
              };
            })
            .filter((ind) => ind.id) || [], // Filter out indicators without a valid id
      };

      setTopics((prev) => {
        return [...(prev || []), T];
      });
    }
  };

  return (
    <section className="md:space-y-6">
      <div className={cn({ container: interactive })}>
        <div className="flex flex-col gap-4 lg:flex-row">
          {TOPICS.map((topic) => {
            const isChecked = !!topics?.find(({ id }) => id === topic.id);

            return (
              <TopicsItem
                key={topic.id}
                {...topic}
                interactive={interactive}
                size={size}
                checked={isChecked}
                onChange={(c) => handleTopicChange(topic, c)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
