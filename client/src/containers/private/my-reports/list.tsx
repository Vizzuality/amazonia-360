"use client";

import { useTranslations } from "next-intl";

import { MyReportsItem } from "@/containers/private/my-reports/item";
import { MyReportsItemSkeleton } from "@/containers/private/my-reports/item/skeleton";

import { Report } from "@/payload-types";

interface MyReportsListProps {
  data: Report[];
  isLoading: boolean;
}

export const MyReportsList = ({ data, isLoading }: MyReportsListProps) => {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MyReportsItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg font-medium">
            {t("my-reports-no-reports-found")}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("my-reports-no-reports-description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((report) => (
        <MyReportsItem key={report.id} report={report} />
      ))}
    </div>
  );
};
