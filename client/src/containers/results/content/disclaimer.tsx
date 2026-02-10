"use client";

import { useMemo, useState } from "react";

import Markdown from "react-markdown";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";

import { useReport } from "@/lib/report";

export default function ReportResultsDisclaimer() {
  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });
  const [now] = useState(() => Date.now());

  const t = useTranslations();
  const expirationDays = 30;
  const isAnonymous = !reportData?.user || reportData.user.relationTo === "anonymous-users";
  const createdAt = useMemo(() => {
    if (!reportData?.user || reportData.user.relationTo !== "anonymous-users") return null;
    const value = reportData.user.value;
    if (!value || typeof value === "string") return null;
    return value.createdAt ? new Date(value.createdAt) : null;
  }, [reportData?.user]);

  const daysLeft = useMemo(() => {
    const msPerDay = 1000 * 60 * 60 * 24;

    return createdAt
      ? Math.max(expirationDays - Math.floor((now - createdAt.getTime()) / msPerDay), 0)
      : expirationDays;
  }, [now, createdAt, expirationDays]);

  if (!isAnonymous) return null;

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
