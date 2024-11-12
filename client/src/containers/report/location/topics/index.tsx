"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, Topic } from "@/constants/topics";

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
              ?.map((indicatorValue) => {
                const indicator = topic.indicators?.find((ind) => ind.value === indicatorValue.id);
                return {
                  id: indicator?.value || "",
                  type: indicator?.types_available?.[0] || "map",
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
    <div className="flex flex-col gap-0.5">
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
