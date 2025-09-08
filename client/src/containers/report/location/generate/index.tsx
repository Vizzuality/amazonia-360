"use client";

import ReactMarkdown from "react-markdown";

import { useSearchParams } from "next/navigation";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { reportPanelAtom } from "@/app/store";

import { ReportGenerateButtons } from "@/containers/report/location/generate/buttons";
import Topics from "@/containers/report/location/generate/topics";

import { Link } from "@/i18n/navigation";

export default function ReportGenerate({ heading = "create" }: { heading?: "select" | "create" }) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const setReportPanel = useSetAtom(reportPanelAtom);

  const HEADER = {
    select: (
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
          <Link
            href={`/report${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
            className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
          >
            <LuArrowLeft className="h-4 w-4" onClick={() => setReportPanel("location")} />
          </Link>
          {t("sidebar-report-location-indicators-title")}
        </h1>
      </div>
    ),
    create: (
      <div className="flex items-baseline justify-between">
        <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
          {t("landing-key-features-grid-buttons-create-report")}
        </h1>
      </div>
    ),
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col justify-between space-y-8 overflow-hidden rounded-lg py-4",
        "lg:border lg:border-blue-100 lg:p-6",
      )}
    >
      <div className="space-y-4">
        {HEADER[heading]}
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">
            <ReactMarkdown>{t("sidebar-report-location-indicators-description")}</ReactMarkdown>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <div className="py-1.5 lg:max-h-[calc(100vh_-_(64px_+_40px_+_263px))] lg:overflow-y-auto">
            <div className="pointer-events-none absolute left-0 right-0 top-0 h-2 bg-gradient-to-b from-white to-transparent" />
            <Topics />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </div>
      <ReportGenerateButtons />
    </div>
  );
}
