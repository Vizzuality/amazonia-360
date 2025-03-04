"use client";

import { useCallback, useState } from "react";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useSetAtom } from "jotai";
import { CircleAlert } from "lucide-react";
import { LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { reportEditionModeAtom } from "@/app/store";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SidebarClearIndicators from "../indicators/sidebar/clear-indicators";
import Search from "../indicators/sidebar/search";
import TopicsList from "../indicators/sidebar/topics";

import AiSidebarContent from "./ai-content";

type ReportResultsTab = "indicators" | "ai_summaries";

export default function ReportSidebar() {
  const { toggleSidebar } = useSidebar();
  const [tab, setTab] = useState<ReportResultsTab>("indicators");
  const setReportEditionMode = useSetAtom(reportEditionModeAtom);

  const handleReportEditionMode = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(false);
  }, [toggleSidebar, setReportEditionMode]);

  return (
    <Sidebar
      className={cn({
        "absolute inset-0 top-0 h-fit w-96 border-none bg-white shadow-md": true,
        "absolute-0 h-full": tab === "indicators",
      })}
    >
      <Tabs
        defaultValue="indicators"
        className="flex flex-col items-start space-y-4 p-5"
        onValueChange={(value) => setTab(value as ReportResultsTab)}
      >
        <SidebarHeader className="flex w-full flex-row items-baseline justify-between p-0">
          <TabsList className="justify-start gap-x-4 gap-y-1 bg-transparent">
            <TabsTrigger value="indicators" className="text-lg font-bold text-muted-foreground">
              Indicators
            </TabsTrigger>

            <TabsTrigger value="ai_summaries" className="text-lg font-bold text-muted-foreground">
              AI Summaries
            </TabsTrigger>
          </TabsList>
          <div className="h-6 justify-start bg-transparent">
            <LuX className="h-4 w-4 cursor-pointer" onClick={handleReportEditionMode} />
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-hidden">
          <TabsContent className="relative w-full" value="indicators">
            <div className="sticky top-0">
              <div className="flex flex-col gap-2 p-2">
                <div className="flex w-full items-center justify-between">
                  <h3 className="text-2xl text-primary">Report indicators</h3>
                </div>
                <p className="text-sm font-semibold leading-5 text-gray-300">
                  Add indicators to your report and view them in various formats—
                  <span className="font-bold">map, table, chart, etc.</span>
                </p>
                <Search />
              </div>

              <ScrollArea className="h-[calc(100vh-287px)]">
                <div className="flex w-full justify-end">
                  <SidebarClearIndicators />
                </div>
                <TopicsList />
                <SidebarGroup />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="ai_summaries">
            <AiSidebarContent />
            <SidebarFooter>
              <div className="flex items-start space-x-4 rounded-sm border border-muted-foreground p-3">
                <CircleAlert className="text-alert h-4 w-4 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  AI generated summaries can be inaccurate. Please, review it carefully.
                </p>
              </div>
            </SidebarFooter>
          </TabsContent>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  );
}
