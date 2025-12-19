"use client";

import { useTranslations } from "next-intl";

import useIsMounted from "@/lib/mounted";
import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/(frontend)/store";

import Create from "@/containers/report/location/create";
import SearchLocation from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarLocationContent() {
  const [location] = useSyncLocation();
  const t = useTranslations();

  const isMounted = useIsMounted();

  return (
    <div
      className={cn({
        "relative space-y-6 overflow-hidden rounded-lg bg-white py-6": true,
        "lg:border lg:border-blue-100 lg:p-6": true,
      })}
    >
      <div className="space-y-4">
        <h1 className="pr-24 text-2xl font-bold text-primary">{t("grid-sidebar-report-title")}</h1>

        <p className="text-sm font-medium text-muted-foreground">
          {t("grid-sidebar-report-description")}
        </p>
      </div>

      {!isMounted() && <Skeleton className="h-16 w-full" />}

      {!location && isMounted() && (
        <div className="space-y-4">
          <SearchLocation />

          <Sketch />
        </div>
      )}

      {location && isMounted() && <Create />}
    </div>
  );
}
