"use client";

import dynamic from "next/dynamic";

import { useLocale, useTranslations } from "next-intl";
import { LuCalendar, LuMapPin } from "react-icons/lu";

import { Card } from "@/components/ui/card";

import { Report } from "@/payload-types";

import { ReportActions } from "./actions";
import { ModuleChips } from "./module-chip";

const ReportMapPreview = dynamic(() => import("@/containers/private/my-reports/item/map-preview"), {
  ssr: false,
});

interface MyReportsItemProps {
  report: Report;
}

export const MyReportsItem = ({ report }: MyReportsItemProps) => {
  const t = useTranslations();

  const locale = useLocale();

  const getLocationLabel = (location: Report["location"]) => {
    if (location.type === "search") {
      return location.text;
    }
    return t("my-reports-item-custom-area");
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
    <Card className="group flex flex-col gap-1 overflow-hidden shadow-none">
      {/* Map Preview */}
      <div className="flex grow flex-col space-y-3 px-5 pt-5 pb-2">
        {/* Header */}
        <header className="flex justify-between gap-2">
          <div className="space-y-4">
            <ModuleChips modules={report.modules} />
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-foreground line-clamp-2 text-lg leading-6 font-medium">
                  {report.title || t("my-reports-item-untitled")}
                </h3>
              </div>

              {report.description && (
                <p className="text-muted-foreground line-clamp-3 text-sm leading-4 font-normal">
                  {report.description}
                </p>
              )}
            </div>
          </div>

          <ReportActions report={report} />
        </header>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <LuMapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{getLocationLabel(report.location)}</span>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <LuCalendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="bg-muted border-border relative flex h-[200px] w-full shrink-0 flex-col overflow-hidden border-t">
        <div className="grow">
          <ReportMapPreview {...report} />
        </div>
      </div>
    </Card>
  );
};
