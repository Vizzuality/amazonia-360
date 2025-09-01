"use client";

import ReactMarkdown from "react-markdown";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { GenerateReport } from "@/containers/report/location/generate/button";
import Topics from "@/containers/report/location/generate/topics";

export default function ReportGenerate() {
  const t = useTranslations();

  return (
    <div
      className={cn({
        "relative space-y-4 overflow-hidden rounded-lg bg-white py-4": true,
        "lg:border lg:border-blue-100 lg:p-6": true,
      })}
    >
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
            {t("landing-key-features-grid-buttons-create-report")}
          </h1>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          <ReactMarkdown>{t("grid-sidebar-report-location-topics-description")}</ReactMarkdown>
        </div>
      </div>
      <div className="relative overflow-hidden">
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
