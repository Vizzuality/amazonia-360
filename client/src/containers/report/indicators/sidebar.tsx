"use client";

import { useCallback, useState } from "react";

import { useAtom } from "jotai";
import { LuX } from "react-icons/lu";

import { useGetTopics } from "@/lib/topics";

import { useSyncTopics, reportEditionModeAtom } from "@/app/store";

import { Topic, TopicsParsed } from "@/constants/topics";

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
import { Skeleton } from "@/components/ui/skeleton";

export function TopicsSidebar() {
  const { toggleSidebar } = useSidebar();
  const [topics, setTopics] = useSyncTopics();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);
  const [items, setItems] = useState<Topic[]>([]);

  const { data: topicsData, isLoading } = useGetTopics();

  const handleReportEditionMode = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(!reportEditionMode);
  }, [toggleSidebar, setReportEditionMode, reportEditionMode]);

  const handleChangeOrder = useCallback(
    (order: string[]) => {
      const newOrderSidebar = order
        .map((id) => topicsData?.find((l) => l.id === id))
        .filter((topic) => topic !== undefined) as Topic[];

      const newOrder = order
        .map((id) => topics?.find((l) => l.id === id))
        .filter((topic) => topic !== undefined) as TopicsParsed[];

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
              {isLoading &&
                [, , ,].map((index) => <Skeleton key={index} className="h-32 w-full" />)}
              {!isLoading &&
                (items.length ? items : topicsData)?.map((topic) => (
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
