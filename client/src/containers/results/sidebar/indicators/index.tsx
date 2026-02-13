"use client";

import React from "react";

import ReactMarkdown from "react-markdown";

import { useTranslations } from "next-intl";

import SidebarIndicatorsFooter from "@/containers/results/sidebar/indicators/footer";

import { ScrollArea } from "@/components/ui/scroll-area";

import Search from "./search";
import TopicsList from "./topics";

export default function IndicatorsSidebarContent() {
  const t = useTranslations();
  return (
    <div className="relative flex grow flex-col overflow-hidden">
      <div className="space-y-4 px-6">
        <div className="text-muted-foreground text-sm leading-5 font-medium">
          <ReactMarkdown>{t("report-results-sidebar-indicators-description")}</ReactMarkdown>
        </div>
        <Search />
      </div>

      <div className="relative flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-50 h-2 bg-gradient-to-b from-white to-transparent" />
        <ScrollArea className="flex grow flex-col px-6">
          <TopicsList />
        </ScrollArea>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-50 h-4 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="px-6 pt-4">
        <SidebarIndicatorsFooter />
      </div>
    </div>
  );
}
