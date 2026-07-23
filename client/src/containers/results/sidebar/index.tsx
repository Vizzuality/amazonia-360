"use client";

import { useCallback } from "react";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { reportEditionModeAtom } from "@/app/(frontend)/store";

import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import IndicatorsSidebarContent from "./indicators";

export default function ReportSidebar() {
  const t = useTranslations();
  const { toggleSidebar } = useSidebar();
  const setReportEditionMode = useSetAtom(reportEditionModeAtom);

  const handleReportEditionMode = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(false);
  }, [toggleSidebar, setReportEditionMode]);

  return (
    <Sidebar
      className={cn({
        "fixed top-0 bottom-0 h-full w-96 border-none bg-white shadow-md": true,
      })}
    >
      <Tabs
        value="indicators"
        className="sticky top-0 z-10 flex max-h-svh grow flex-col items-start space-y-4 overflow-hidden bg-white"
      >
        <div className="flex grow flex-col overflow-hidden pt-6 pb-4">
          <SidebarHeader className="flex w-full flex-row items-baseline justify-between px-6 py-0">
            <TabsList className="justify-start gap-x-4 gap-y-1 bg-transparent">
              <TabsTrigger
                value="indicators"
                className="text-muted-foreground px-0 py-0 text-lg font-bold"
              >
                {t("report-results-sidebar-indicators-title")}
              </TabsTrigger>

              {/* <TabsTrigger
                value="ai_summaries"
                className="m-0 px-0 py-0 text-lg font-bold text-muted-foreground"
              >
                {t("report-results-sidebar-ai-summaries-title")}
              </TabsTrigger> */}
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

            {/* <TabsContent
              value="ai_summaries"
              className="grow flex-col overflow-hidden data-[state=active]:flex"
            >
              <AiSidebarContent />
            </TabsContent> */}
          </SidebarContent>
        </div>
      </Tabs>
    </Sidebar>
  );
}
