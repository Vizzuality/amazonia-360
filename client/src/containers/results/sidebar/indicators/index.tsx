"use client";

import React from "react";

import ReactMarkdown from "react-markdown";

import { useTranslations } from "next-intl";

import { ScrollArea } from "@/components/ui/scroll-area";

import SidebarClearIndicators from "./clear-indicators";
import Search from "./search";
import TopicsList from "./topics";

export default function IndicatorsSidebarContent() {
  const t = useTranslations();
  return (
    <div className="relative h-full">
      <div className="space-y-4">
        <div className="text-sm font-medium leading-5 text-muted-foreground">
          <ReactMarkdown>{t("report-results-sidebar-indicators-description")}</ReactMarkdown>
        </div>
        <Search />
      </div>

      <div className="mb-4 flex w-full justify-end pr-2">
        <SidebarClearIndicators />
      </div>

      <div className="relative flex h-full w-full grow">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2 bg-gradient-to-b from-white to-transparent" />
        <ScrollArea className="h-screen max-h-[calc(100vh-264px)] w-[calc(100%+40px)]">
          <TopicsList />
        </ScrollArea>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}
