"use client";

import { useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import IndicatorsFooter from "@/containers/report/indicators/footer";
import IndicatorsSearch from "@/containers/report/indicators/search";
import IndicatorsTopicsList from "@/containers/report/indicators/topics";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Link } from "@/i18n/navigation";

export default function ReportIndicatorsContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  return (
    <div className="relative flex h-full grow flex-col space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white py-6 backdrop-blur-xl xl:space-y-4">
      <div className="space-y-2 px-6">
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
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          {t("grid-sidebar-grid-filters-description")}
        </p>
      </div>

      <div className="px-6">
        <IndicatorsSearch />
      </div>

      <div className="relative flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2.5 bg-gradient-to-b from-white to-transparent" />
        <ScrollArea className="flex grow flex-col">
          <div className="px-6">
            <IndicatorsTopicsList />
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="px-6">
        <IndicatorsFooter />
      </div>
    </div>
  );
}
