"use client";

import { useLocale } from "next-intl";
import { LuCalendar, LuMapPin, LuFileText } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Link } from "@/i18n/navigation";
import { Report } from "@/payload-types";

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
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="flex grow flex-col p-6">
        {/* Header */}
        <div className="mb-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
              {report.title || "Untitled Report"}
            </h3>
            <LuFileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>

          {report.description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{report.description}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LuMapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{getLocationLabel(report.location)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LuCalendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(report.createdAt)}</span>
          </div>

          {report.topics && report.topics.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {report.topics.length} {report.topics.length === 1 ? "topic" : "topics"}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4">
          <Link href={`/report/${report.id}`}>
            <Button className="w-full" variant="default">
              View Report
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
