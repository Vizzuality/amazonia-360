"use client";

import { useState } from "react";

import Link from "next/link";

import { TOPICS, Topic } from "@/constants/topics";

import TopicsItem from "@/containers/report/topics/item";

import { Button } from "@/components/ui/button";

export default function Topics() {
  const [topics, setTopics] = useState<string[]>([]);
  const handleTopicChange = (id: Topic["id"], checked: boolean) => {
    if (checked) {
      setTopics((prev) => [...prev, id]);
    } else {
      setTopics((prev) => prev.filter((i) => i !== id));
    }
  };

  return (
    <section className="space-y-6">
      <div className="container">
        <div className="grid grid-cols-12 gap-4">
          {TOPICS.map((topic) => (
            <TopicsItem
              key={topic.id}
              {...topic}
              checked={topics.includes(topic.id)}
              onChange={(c) => {
                handleTopicChange(topic.id, c);
              }}
            />
          ))}
        </div>
      </div>
      <div className="container">
        <div className="flex justify-center space-x-4">
          <Link href="/report">
            <Button variant="secondary">Cancel</Button>
          </Link>

          <Link href="/report/results">
            <Button>Generate Report</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
