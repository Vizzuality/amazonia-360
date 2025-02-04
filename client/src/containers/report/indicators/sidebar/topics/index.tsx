"use client";

import { useCallback, useMemo } from "react";

import { useGetTopics } from "@/lib/topics";

import { useSyncTopics } from "@/app/store";

import { TopicItem } from "./item";
import SortableList from "./sortable";

export default function TopicsList() {
  const [topics, setTopics] = useSyncTopics();

  const { data: topicsData } = useGetTopics();

  const ITEMS = useMemo(() => {
    return topicsData
      ?.toSorted((a, b) => {
        const aIndex = topics?.findIndex((t) => t.id === a.id) || 0;
        const bIndex = topics?.findIndex((t) => t.id === b.id) || 0;

        if (aIndex === bIndex) {
          return 0;
        }

        if (aIndex === -1) {
          return 1;
        }

        if (bIndex === -1) {
          return -1;
        }

        return aIndex - bIndex;
      })
      ?.map((topic) => <TopicItem key={topic.id} topic={topic} id={topic.id} />);
  }, [topics, topicsData]);

  const handleChangeOrder = useCallback(
    (order: number[]) => {
      const newOrder = order
        .map((id) => topics?.find((l) => l.id === id))
        .filter((topic) => topic !== undefined);

      const newOrderReport = newOrder
        .map((topic) => ({
          id: topic.id,
          indicators: topic?.indicators || [],
        }))
        .filter((topic) => !!topic.indicators);
      setTopics(newOrderReport);
    },

    [topics, setTopics],
  );

  return (
    <ul className="flex h-full flex-col gap-2 overflow-y-auto">
      <SortableList onChangeOrder={handleChangeOrder} sortable={{ handle: true, enabled: true }}>
        {ITEMS}
      </SortableList>
    </ul>
  );
}
