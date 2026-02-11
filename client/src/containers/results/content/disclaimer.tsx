"use client";

import { useState } from "react";

import Markdown from "react-markdown";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";

import { useReport } from "@/lib/report";

const EXPIRATION_DAYS = 30;

export default function ReportResultsDisclaimer() {
  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });
  const [now] = useState(() => Date.now());

  const t = useTranslations();
  const isDraft = reportData?._status === "draft";

  const msPerDay = 1000 * 60 * 60 * 24;
  const updatedAt = reportData?.updatedAt ? new Date(reportData.updatedAt).getTime() : now;
  const elapsedDays = Math.max(0, Math.floor((now - updatedAt) / msPerDay));
  const daysLeft = EXPIRATION_DAYS - elapsedDays;

  if (!isDraft) return null;

  return (
    <div className="container">
      <div className="flex flex-col gap-4 rounded-md border border-border bg-orange-50 px-4 py-3">
        <Markdown className="text-normal mt-2 text-foreground 2xl:text-lg">
          {t("report-results-anonymous-disclaimer", { days: daysLeft })}
        </Markdown>
      </div>
    </div>
  );
}
