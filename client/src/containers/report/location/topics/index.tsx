"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, TopicIds } from "@/constants/topics";

import TopicsItem from "@/containers/report/location/topics/item";

export default function Topics() {
  const [topics, setTopics] = useSyncTopics();
  const handleTopicChange = (id: TopicIds, checked: boolean) => {
    if (checked) {
      setTopics((prev) => {
        if (prev) return [...prev, id];
        return [id];
      });
    } else {
      setTopics((prev) => {
        if (prev) return prev.filter((t) => t !== id);
        return [];
      });
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      {TOPICS.map((topic) => (
        <TopicsItem
          key={topic.id}
          {...topic}
          checked={(topics || []).includes(topic.id)}
          onChange={(c) => {
            handleTopicChange(topic.id, c);
          }}
        />
      ))}
    </div>
  );
}
