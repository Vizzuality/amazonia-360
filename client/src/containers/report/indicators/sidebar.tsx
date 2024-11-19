"use client";

import { useState, useCallback } from "react";

import { useAtom } from "jotai";
import { LuX } from "react-icons/lu";

import { useSyncTopics, reportEditionModeAtom } from "@/app/store";

import { TOPICS, Topic, TopicsParsed } from "@/constants/topics";

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
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);
  const [items, setItems] = useState<Topic[]>(TOPICS);

  const handleReportEditionMode = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(!reportEditionMode);
  }, [toggleSidebar, setReportEditionMode, reportEditionMode]);

  const handleChangeOrder = useCallback(
    (order: string[]) => {
      const newOrderSidebar = order
        .map((id) => TOPICS.find((l) => l.id === id))
        .filter((topic) => topic !== undefined) as Topic[];

      const newOrder = order
        .map((id) => topics?.find((l) => l.id === id))
        .filter((topic) => topic !== undefined) as TopicsParsed[];

      setItems(newOrderSidebar);
      const newOrderReport = newOrder
        .map((topic) => ({
          id: topic.id,
          indicators: topic?.indicators || [],
        }))
        .filter((topic) => !!topic.indicators);

      setTopics(newOrderReport);
    },

    [setItems, setTopics, topics],
  );

  return (
    <Sidebar className="absolute -top-12 bottom-12 w-96 bg-white">
      <div className="sticky top-0 p-6">
        <SidebarHeader>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-2xl text-primary">Report indicators</h3>
            <LuX className="h-4 w-4 cursor-pointer" onClick={handleReportEditionMode} />
          </div>
          <p className="text-sm font-semibold leading-5 text-gray-300">
            Add indicators to your report and view them in various formats—
            <span className="font-bold">map, table, chart, etc.</span>
          </p>
        </SidebarHeader>
        <SidebarContent>
          <ul className="flex flex-1 flex-col gap-2">
            <SortableList
              onChangeOrder={handleChangeOrder}
              sortable={{ handle: true, enabled: true }}
            >
              {(items || topics).map((topic) => (
                <TopicsReportItems key={topic.id} topic={topic} id={topic.id} />
              ))}
            </SortableList>
          </ul>
          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter />
      </div>
    </Sidebar>
  );
}
