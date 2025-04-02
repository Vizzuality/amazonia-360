"use client";

import { useCallback } from "react";

import ReactMarkdown from "react-markdown";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { useGetDefaultTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { reportPanelAtom, useSyncTopics } from "@/app/store";

import { GenerateReport } from "@/containers/report/location/generate";
import Topics from "@/containers/report/location/topics";

export default function TabsTopics() {
  const t = useTranslations();
  const locale = useLocale();
  const setReportPanel = useSetAtom(reportPanelAtom);
  const [activeTopics, setTopics] = useSyncTopics();

  const { data: topics } = useGetDefaultTopics({ locale });

  const handleTopicsSelection = useCallback(() => {
    if (topics?.length === activeTopics?.length) {
      setTopics([]);
    } else {
      if (topics) {
        setTopics(
          topics?.map(({ id, default_visualization }) => ({
            id,
            indicators: default_visualization,
          })),
        );
      }
    }
  }, [setTopics, topics, activeTopics]);

  return (
    <div
      className={cn({
        "relative space-y-4 overflow-hidden rounded-lg bg-white py-4": true,
        "lg:border lg:border-blue-100 lg:p-4": true,
      })}
    >
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
            <button
              type="button"
              onClick={() => setReportPanel("location")}
              className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
            >
              <LuArrowLeft className="h-4 w-4" />
            </button>
            {t("grid-sidebar-report-location-topics-title")}
          </h1>
          <button
            type="button"
            className="whitespace-nowrap text-xs font-bold text-foreground transition-all duration-500 ease-in-out hover:underline"
            onClick={handleTopicsSelection}
          >
            {topics?.length !== activeTopics?.length ? t("select-all") : t("unselect-all")}
          </button>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          <ReactMarkdown>{t("grid-sidebar-report-location-topics-description")}</ReactMarkdown>
        </div>
      </div>
      <div className="relative overflow-hidden lg:h-full lg:max-h-[calc(100vh_-_(64px_+_40px_+_263px))]">
        <div className="py-1.5 lg:max-h-[calc(100vh_-_(64px_+_40px_+_263px))] lg:overflow-y-auto">
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-2 bg-gradient-to-b from-white to-transparent" />
          <Topics />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>

      <GenerateReport />
    </div>
  );
}
