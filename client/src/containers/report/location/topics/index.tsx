"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, Topic, DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

import TopicsItem from "@/containers/report/location/topics/item";

export default function Topics() {
  const [topics, setTopics] = useSyncTopics();

  const handleTopicChange = (topic: Topic, checked: boolean) => {
    setTopics((prev) => {
      if (checked) {
        const newTopic = {
          id: topic.id,
          indicators:
            topic.default_visualization
              ?.map((indicator) => {
                return {
                  ...indicator,
                  x: indicator?.x || 0,
                  y: indicator?.y || 0,
                  w: indicator?.w || DEFAULT_VISUALIZATION_SIZES[indicator?.type].w,
                  h: indicator?.h || DEFAULT_VISUALIZATION_SIZES[indicator?.type].h,
                };
              })
              .filter((ind) => ind.id) || [],
        };
        return [...(prev || []), newTopic];
      } else {
        return prev?.filter((t) => t.id !== topic.id) || [];
      }
    });
  };

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {TOPICS.map((topic) => {
        const isChecked = !!topics?.find(({ id }) => id === topic.id);

        return (
          <TopicsItem
            key={topic.id}
            {...topic}
            checked={isChecked}
            onChange={(c) => handleTopicChange(topic, c)}
          />
        );
      })}
    </div>
  );
}
