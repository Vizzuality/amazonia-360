"use client";

import { useCallback } from "react";

import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import {
  reportEditionModeAtom,
  ReportResultsTab,
  resultsSidebarTabAtom,
} from "@/app/(frontend)/store";

import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AiSidebarContent from "./ai-content";
import IndicatorsSidebarContent from "./indicators";

export default function ReportSidebar() {
  const t = useTranslations();
  const { toggleSidebar } = useSidebar();
  const [tab, setTab] = useAtom(resultsSidebarTabAtom);
  const setReportEditionMode = useSetAtom(reportEditionModeAtom);

  const handleReportEditionMode = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(false);
  }, [toggleSidebar, setReportEditionMode]);

  return (
    <Sidebar
      className={cn({
        "fixed bottom-0 top-0 h-full w-96 border-none bg-white shadow-md": true,
      })}
    >
      <Tabs
        value={tab}
        className="sticky top-0 z-10 flex max-h-svh grow flex-col items-start space-y-4 overflow-hidden bg-white pt-14"
        onValueChange={(value) => setTab(value as ReportResultsTab)}
      >
        <div className="flex grow flex-col overflow-hidden pb-4 pt-6">
          <SidebarHeader className="flex w-full flex-row items-baseline justify-between px-6 py-0">
            <TabsList className="justify-start gap-x-4 gap-y-1 bg-transparent">
              <TabsTrigger
                value="indicators"
                className="px-0 py-0 text-lg font-bold text-muted-foreground"
              >
                {t("report-results-sidebar-indicators-title")}
              </TabsTrigger>

              <TabsTrigger
                value="ai_summaries"
                className="m-0 px-0 py-0 text-lg font-bold text-muted-foreground"
              >
                {t("report-results-sidebar-ai-summaries-title")}
              </TabsTrigger>
            </TabsList>
            <div className="h-6 justify-start bg-transparent">
              <LuX className="h-4 w-4 cursor-pointer" onClick={handleReportEditionMode} />
            </div>
          </SidebarHeader>

          <SidebarContent
            className={cn({
              "flex w-full grow flex-col pt-4": true,
            })}
          >
            <TabsContent
              value="indicators"
              className="grow flex-col overflow-hidden data-[state=active]:flex"
            >
              <IndicatorsSidebarContent />
            </TabsContent>

            <TabsContent
              value="ai_summaries"
              className="grow flex-col overflow-hidden data-[state=active]:flex"
            >
              <AiSidebarContent />
            </TabsContent>
          </SidebarContent>
        </div>
      </Tabs>
    </Sidebar>
  );
}
