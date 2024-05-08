"use client";

import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { TOPICS, TopicIds } from "@/constants/topics";

import TopicsItem from "@/containers/report/topics/item";

export interface TopicsProps {
  interactive?: boolean;
  size: "sm" | "md" | "lg";
}

export default function Topics({
  interactive = true,
  size = "md",
}: TopicsProps) {
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
    <section className="md:space-y-6">
      <div className={cn({ container: interactive })}>
        <div className="flex md:flex-row flex-col gap-4">
          {TOPICS.map((topic) => (
            <TopicsItem
              key={topic.id}
              {...topic}
              interactive={interactive}
              size={size}
              checked={(topics || []).includes(topic.id)}
              onChange={(c) => {
                interactive && handleTopicChange(topic.id, c);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
