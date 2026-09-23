"use client";

import React, { useMemo } from "react";

import ReactMarkdown from "react-markdown";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { useReportCountry } from "@/lib/use-report-country";

import { useSyncIndicatorsScopeFilter } from "@/app/(frontend)/store";

import { getIndicatorScopeCounts, IndicatorsFilterTabs } from "@/containers/indicators/filter-tabs";
import SidebarIndicatorsFooter from "@/containers/results/sidebar/indicators/footer";

import { ScrollArea } from "@/components/ui/scroll-area";

import Search from "./search";
import TopicsList from "./topics";

export default function IndicatorsSidebarContent() {
  const t = useTranslations();
  const locale = useLocale();
  const country = useReportCountry();
  const [scopeFilter, setScopeFilter] = useSyncIndicatorsScopeFilter();

  const { data: indicatorsData } = useGetDefaultIndicators({ locale, country });
  const scopeCounts = useMemo(
    () => getIndicatorScopeCounts(indicatorsData ?? []),
    [indicatorsData],
  );

  return (
    <div className="relative flex grow flex-col overflow-hidden">
      <div className="space-y-4 px-6">
        <div className="text-muted-foreground text-sm leading-5 font-medium">
          <ReactMarkdown>{t("report-results-sidebar-indicators-description")}</ReactMarkdown>
        </div>
        <Search />
        {!!country && !!indicatorsData?.length && (
          <IndicatorsFilterTabs
            value={scopeFilter}
            onValueChange={setScopeFilter}
            counts={scopeCounts}
          />
        )}
      </div>

      <div className="relative flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-50 h-2 bg-linear-to-b from-white to-transparent" />
        <ScrollArea className="flex grow flex-col px-6">
          <TopicsList />
        </ScrollArea>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-50 h-4 bg-linear-to-t from-white to-transparent" />
      </div>

      <div className="px-6 pt-4">
        <SidebarIndicatorsFooter />
      </div>
    </div>
  );
}
