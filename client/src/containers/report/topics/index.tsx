"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, Topic } from "@/constants/topics";

import TopicsItem from "@/containers/report/topics/item";

export interface TopicsProps {
  size: "sm" | "md" | "lg";
}

export default function Topics({ size = "md" }: TopicsProps) {
  const [topics, setTopics] = useSyncTopics();
  const handleTopicChange = (id: Topic["id"], checked: boolean) => {
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
    <section className="space-y-6">
      <div className="container">
        <div className="flex gap-4">
          {TOPICS.map((topic) => (
            <TopicsItem
              key={topic.id}
              {...topic}
              size={size}
              checked={(topics || []).includes(topic.id)}
              onChange={(c) => {
                handleTopicChange(topic.id, c);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
