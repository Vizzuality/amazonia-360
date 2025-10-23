"use client";

import { useLocale } from "next-intl";

import { useGetDefaultTopics } from "@/lib/topics";

import { TopicItem } from "./item";

export default function TopicsList() {
  const locale = useLocale();

  const { data: topicsData } = useGetDefaultTopics({ locale });

  return (
    <ul className="relative flex flex-col gap-1 py-2">
      {topicsData?.map((topic) => (
        <TopicItem key={topic.id} topic={topic} id={topic.id} />
      ))}
    </ul>
  );
}
