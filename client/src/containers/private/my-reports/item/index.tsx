"use client";

import dynamic from "next/dynamic";

import { useLocale } from "next-intl";
import { LuCalendar, LuMapPin } from "react-icons/lu";

import { Card } from "@/components/ui/card";

import { Report } from "@/payload-types";

import { ReportActions } from "./actions";

const ReportMapPreview = dynamic(() => import("@/containers/private/my-reports/item/map-preview"), {
  ssr: false,
});

interface MyReportsItemProps {
  report: Report;
}

export const MyReportsItem = ({ report }: MyReportsItemProps) => {
  const locale = useLocale();

  const getLocationLabel = (location: Report["location"]) => {
    if (location.type === "search") {
      return location.text;
    }
    return "Custom area";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="group flex flex-col overflow-hidden">
      {/* Map Preview */}
      <div className="flex grow flex-col space-y-3 p-6">
        {/* Header */}
        <header className="flex justify-between gap-2">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-lg font-medium text-foreground">
                {report.title || "Untitled Report"}
              </h3>
            </div>

            {report.description && (
              <p className="line-clamp-3 text-sm font-medium text-muted-foreground">
                {report.description}
              </p>
            )}
          </div>

          <ReportActions report={report} />
        </header>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LuMapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{getLocationLabel(report.location)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LuCalendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </div>

        <div className="relative flex min-h-[12rem] w-full grow flex-col overflow-hidden rounded-sm bg-muted">
          <div className="grow">
            <ReportMapPreview {...report} />
          </div>
        </div>
      </div>
    </Card>
  );
};
