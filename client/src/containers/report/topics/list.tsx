"use client";

import { useCallback, useState } from "react";

import { useGetTopics } from "@/lib/topics";

import { useSyncTopics } from "@/app/store";

import { Topic } from "@/constants/topics";

import { TopicsReportItems } from "@/containers/report/indicators/item";
import SortableList from "@/containers/report/sortable/list";

export default function TopicsSidebar() {
  const [topics, setTopics] = useSyncTopics();
  const [items, setItems] = useState<Topic[]>([]);

  const { data: topicsData } = useGetTopics();

  const handleChangeOrder = useCallback(
    (order: number[]) => {
      const newOrderSidebar = order
        .map((id) => topicsData?.find((l) => l.id === id))
        .filter((topic) => topic !== undefined) as Topic[];

      const newOrder = order
        .map((id) => topics?.find((l) => l.id === id))
        .filter((topic) => topic !== undefined);

      const newOrderReport = newOrder
        .map((topic) => ({
          id: topic.id,
          indicators: topic?.indicators || [],
        }))
        .filter((topic) => !!topic.indicators);
      setItems(newOrderSidebar);
      setTopics(newOrderReport);
    },

    [setTopics, topics, topicsData],
  );

  return (
    <ul className="flex flex-1 flex-col gap-2">
      <SortableList onChangeOrder={handleChangeOrder} sortable={{ handle: true, enabled: true }}>
        {(items.length ? items : topicsData)?.map((topic) => (
          <TopicsReportItems key={topic.id} topic={topic} id={topic.id} />
        ))}
      </SortableList>
    </ul>
  );
}
