"use client";

import { useState, useCallback } from "react";

import { LuX } from "react-icons/lu";

import { useSyncTopics } from "@/app/store";

import { TOPICS, Topic } from "@/constants/topics";

import { TopicsReportItems } from "@/containers/report/indicators/item";
import SortableList from "@/containers/report/sortable/list";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

export function TopicsSidebar() {
  const { toggleSidebar } = useSidebar();
  const [topics, setTopics] = useSyncTopics();
  const [items, setItems] = useState<Topic[]>(TOPICS);

  const handleChangeOrder = useCallback(
    (order: string[]) => {
      const newOrder = order
        .map((id) => TOPICS.find((l) => l.id === id))
        .filter((topic) => topic !== undefined) as Topic[];

      setTopics(newOrder.map((t) => t.id));
      setItems(newOrder);
    },
    [setTopics, setItems],
  );

  return (
    <Sidebar className="w-96 bg-white p-6">
      <SidebarHeader>
        <div className="flex w-full items-center justify-between">
          <h3>Report indicators</h3>
          <LuX className="h-4 w-4 cursor-pointer" onClick={toggleSidebar} />
        </div>
        <p className="text-sm font-semibold leading-5 text-gray-300">
          Add indicators to your report and view them in various formats—map, table, chart,
          etc—tailored to your needs.
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SortableList onChangeOrder={handleChangeOrder} sortable={{ handle: true, enabled: true }}>
          {(items || topics).map((topic) => (
            <TopicsReportItems key={topic.id} topic={topic} id={topic.id} />
          ))}
        </SortableList>

        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
