"use client";

import { useGetTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic } from "@/constants/topics";

import TopicsItem from "@/containers/report/topics/item";

export interface TopicsProps {
  interactive?: boolean;
  size: "sm" | "md" | "lg";
}

export default function Topics({ interactive = true, size = "md" }: TopicsProps) {
  const [topics, setTopics] = useSyncTopics();

  const { data: topicsData } = useGetTopics();

  const handleTopicChange = (topic: Topic, checked: boolean) => {
    if (checked) {
      setTopics((prev) => prev?.filter((t) => t.id !== topic.id) || []);
    } else {
      const T = {
        id: topic.id,
        indicators:
          topic.default_visualization
            ?.map((indicator) => {
              return {
                id: indicator?.id,
                type: indicator?.type,
                x: indicator?.x || 0,
                y: indicator?.y || 0,
                w: indicator?.w || DEFAULT_VISUALIZATION_SIZES[indicator.type].w,
                h: indicator?.h || DEFAULT_VISUALIZATION_SIZES[indicator.type].h,
              };
            })
            .filter((ind) => ind.id) || [],
      };
      setTopics((prev) => [...(prev || []), T]);
    }
  };

  return (
    <section className="md:space-y-6">
      <div className={cn({ container: interactive })}>
        <div className="flex flex-col gap-4 lg:flex-row">
          {topicsData?.map((topic) => {
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
