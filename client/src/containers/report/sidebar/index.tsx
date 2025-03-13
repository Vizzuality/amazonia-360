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

  // Sticky state
  const [isSticky, setIsSticky] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stickyRef.current) return;

    const observer = new IntersectionObserver(
      ([event]) => {
        setIsSticky(event.intersectionRatio < 1);
      },
      {
        threshold: [1],
        rootMargin: "-5px 0px 0px 0px",
      },
    );

    observer.observe(stickyRef.current);

    return () => observer.disconnect();
  }, [isSticky]);

  return (
    <Sidebar
      className={cn({
        "absolute bottom-0 top-0 h-full w-96 border-none bg-white shadow-md": true,
      })}
    >
      <Tabs
        defaultValue="indicators"
        className="sticky top-0 z-10 flex max-h-[100vh] grow flex-col items-start space-y-4 bg-white p-6"
        onValueChange={(value) => setTab(value as ReportResultsTab)}
      >
        <div ref={stickyRef} className="h-full w-full grow">
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
              "min-h-screen w-full flex-1 pt-6": true,
            })}
          >
            <TabsContent value="indicators" className="h-full pr-2">
              <IndicatorsSidebarContent />
            </TabsContent>

            <TabsContent value="ai_summaries" className="h-full pr-2">
              <AiSidebarContent isSticky={isSticky} />
            </TabsContent>
          </SidebarContent>
        </div>
      </Tabs>
    </Sidebar>
  );
}
