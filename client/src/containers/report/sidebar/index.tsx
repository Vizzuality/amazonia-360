"use client";

import { useCallback, useState, useRef, useEffect } from "react";

import { useSetAtom } from "jotai";
import { LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { reportEditionModeAtom } from "@/app/store";

import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AiSidebarContent from "./ai-content";
import IndicatorsSidebarContent from "./indicators";

type ReportResultsTab = "indicators" | "ai_summaries";

export default function ReportSidebar() {
  const { toggleSidebar } = useSidebar();
  const [, setTab] = useState<ReportResultsTab>("indicators");
  const setReportEditionMode = useSetAtom(reportEditionModeAtom);

  const handleReportEditionMode = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(false);
  }, [toggleSidebar, setReportEditionMode]);

  const [isSticky, setIsSticky] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (stickyRef.current) {
        const rect = stickyRef.current.getBoundingClientRect();
        if (rect.top === 0) setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Sidebar
      className={cn({
        "absolute bottom-0 top-0 h-full w-96 border-none bg-white shadow-md": true,
      })}
    >
      <Tabs
        defaultValue="indicators"
        ref={stickyRef}
        className="sticky top-0 flex flex-col items-start space-y-4 p-6"
        onValueChange={(value) => setTab(value as ReportResultsTab)}
      >
        <SidebarHeader className="flex w-full flex-row items-baseline justify-between p-0">
          <TabsList className="justify-start gap-x-4 gap-y-1 bg-transparent">
            <TabsTrigger
              value="indicators"
              className="px-0 text-lg font-bold text-muted-foreground"
            >
              Indicators
            </TabsTrigger>

            <TabsTrigger
              value="ai_summaries"
              className="m-0 px-0 text-lg font-bold text-muted-foreground"
            >
              AI Summaries
            </TabsTrigger>
          </TabsList>
          <div className="h-6 justify-start bg-transparent">
            <LuX className="h-4 w-4 cursor-pointer" onClick={handleReportEditionMode} />
          </div>
        </SidebarHeader>

        <SidebarContent
          className={cn({
            "h-full w-full flex-1": true,
            "h-[calc(100vh-64px-80px)]": !isSticky,
            "h-[calc(100vh-64px)]": isSticky,
          })}
        >
          <TabsContent value="indicators" className="h-full">
            <IndicatorsSidebarContent />
          </TabsContent>

          <TabsContent value="ai_summaries" className="h-full">
            <AiSidebarContent />
          </TabsContent>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  );
}
