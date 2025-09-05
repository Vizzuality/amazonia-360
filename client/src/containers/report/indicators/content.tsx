"use client";

import { useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { Link } from "@/i18n/navigation";

export default function ReportIndicatorsContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  return (
    <div className="relative h-full space-y-2 overflow-hidden bg-white p-6 backdrop-blur-xl lg:rounded-lg lg:border lg:border-blue-100 xl:space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
            <Link
              href={`/report${searchParams ? `?${searchParams.toString()}` : ""}`}
              className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
            >
              <LuArrowLeft className="h-4 w-4" />
            </Link>
            {t("indicators")}
          </h1>

          {/* <GridFiltersControlsClear /> */}
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          {t("grid-sidebar-grid-filters-description")}
        </p>
      </div>
      {/* <GridFiltersSearch className="py-0" /> */}

      {/* <GridFiltersControls /> */}

      <div className="space-y-5">
        <div className="relative h-full max-h-[calc(100vh_-_(64px_+_40px_+_310px))]">
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2.5 bg-gradient-to-b from-white to-transparent" />
          <div className="h-full max-h-[calc(100vh_-_(64px_+_40px_+_310px_+_46px))] overflow-y-auto px-1 py-1">
            Topics
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </div>
  );
}
