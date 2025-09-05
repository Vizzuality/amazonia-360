"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/store";

import SearchLocation from "@/containers/report/location/search";

export default function SidebarLocationContent() {
  const [location] = useSyncLocation();
  const t = useTranslations();

  return (
    <div
      className={cn({
        "relative space-y-6 overflow-hidden rounded-lg bg-white py-6": true,
        "lg:border lg:border-blue-100 lg:p-6": true,
      })}
    >
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-primary">{t("grid-sidebar-report-title")}</h1>

        <p className="text-sm font-medium text-muted-foreground">
          {t("grid-sidebar-report-description")}
        </p>
      </div>

      {!location && (
        <div className="space-y-4">
          <SearchLocation />
        </div>
      )}
    </div>
  );
}
