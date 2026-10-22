"use client";

import dynamic from "next/dynamic";

import { useLocale, useTranslations } from "next-intl";
import { LuCalendar, LuMapPin } from "react-icons/lu";

import { Card } from "@/components/ui/card";

import { LocaleLink } from "@/i18n/navigation";
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

  const getFormattedDate = (dateString: string) => {
    const parts = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).formatToParts(new Date(dateString));
    return ["day", "month", "year"]
      .map((type) => parts.find((part) => part.type === type)?.value.replace(".", ""))
      .join(" ");
  };

  return (
    <Card className="group after:border-border relative flex flex-col gap-1 overflow-hidden border-0 shadow-none transition-[translate,box-shadow] duration-150 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border hover:shadow-md has-[button[aria-expanded=true]]:shadow-md motion-safe:hover:-translate-y-1 motion-safe:has-[button[aria-expanded=true]]:-translate-y-1">
      {/* Map Preview */}
      <div className="flex grow flex-col space-y-3 px-5 pt-5 pb-2">
        {/* Header */}
        <header className="space-y-4 [&>:first-child]:pr-7">
          <ModuleChips modules={report.modules} />
          <div className="space-y-2">
            <h3 className="text-foreground line-clamp-2 text-lg leading-6 font-medium">
              <LocaleLink
                href={`/reports/${report.id}`}
                className="focus-visible:after:ring-ring after:absolute after:inset-0 after:z-[1] after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset"
              >
                {report.title || t("my-reports-item-untitled")}
              </LocaleLink>
            </h3>

            {report.description && (
              <p className="text-muted-foreground line-clamp-3 text-sm leading-4 font-normal">
                {report.description}
              </p>
            )}
          </div>
        </header>

        <div className="absolute top-2 right-2 z-[2]">
          <ReportActions report={report} />
        </div>

        {/* Metadata */}
        <div className="text-muted-foreground flex items-center gap-3.5 text-xs leading-6 font-semibold">
          <div className="flex min-w-0 items-center gap-1">
            <LuMapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{getLocationLabel(report.location)}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <LuCalendar className="h-4 w-4 shrink-0" />
            <span>{getFormattedDate(report.createdAt)}</span>
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
