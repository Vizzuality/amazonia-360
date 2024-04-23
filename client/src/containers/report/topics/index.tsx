"use client";

import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { TOPICS, Topic } from "@/constants/topics";

import TopicsItem from "@/containers/report/topics/item";

export interface TopicsProps {
  clickable?: boolean;
  size: "sm" | "md" | "lg";
}

export default function Topics({ clickable = true, size = "md" }: TopicsProps) {
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
    <section className="md:space-y-6">
      <div className={cn({ container: clickable })}>
        <div className="flex md:flex-row flex-col gap-4">
          {TOPICS.map((topic) => (
            <TopicsItem
              key={topic.id}
              {...topic}
              clickable={clickable}
              size={size}
              checked={(topics || []).includes(topic.id)}
              onChange={(c) => {
                clickable && handleTopicChange(topic.id, c);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
