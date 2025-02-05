"use client";

import { useCallback } from "react";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useSetAtom } from "jotai";
import { LuX } from "react-icons/lu";

import { reportEditionModeAtom } from "@/app/store";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import Search from "./search";
import TopicsList from "./topics";

export default function TopicsSidebar() {
  const { toggleSidebar } = useSidebar();
  const setReportEditionMode = useSetAtom(reportEditionModeAtom);

  const handleReportEditionMode = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(false);
  }, [toggleSidebar, setReportEditionMode]);

  return (
    <Sidebar className="absolute bottom-0 top-0 h-full w-96 bg-white">
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
          <Search />
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-[calc(100vh-245px)]">
            <TopicsList />
            <SidebarGroup />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter />
      </div>
    </Sidebar>
  );
}
