"use client";

import { useTranslations } from "next-intl";

import { Indicator } from "@/types/indicator";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type IndicatorScopeFilter = "all" | "regional" | "national";

const FILTER_KEYS: Record<IndicatorScopeFilter, string> = {
  all: "country-module-filter-all",
  regional: "country-module-filter-regional",
  national: "country-module-filter-national",
};

export function getIndicatorScope(indicator: Pick<Indicator, "country">): "regional" | "national" {
  return indicator.country ? "national" : "regional";
}

export function getIndicatorScopeCounts(
  indicators: Pick<Indicator, "country">[],
): Record<IndicatorScopeFilter, number> {
  const national = indicators.filter(
    (indicator) => getIndicatorScope(indicator) === "national",
  ).length;

  return { all: indicators.length, regional: indicators.length - national, national };
}

export function getFilteredIndicators<T extends Pick<Indicator, "country">>(
  indicators: T[],
  filter: IndicatorScopeFilter,
): T[] {
  if (filter === "all") return indicators;

  return indicators.filter((indicator) => getIndicatorScope(indicator) === filter);
}

export function IndicatorsFilterTabs({
  value,
  onValueChange,
  counts,
}: {
  value: IndicatorScopeFilter;
  onValueChange: (value: IndicatorScopeFilter) => void;
  counts: Record<IndicatorScopeFilter, number>;
}) {
  const t = useTranslations();

  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as IndicatorScopeFilter)}>
      <TabsList className="gap-x-4 space-x-0 px-3">
        {(Object.keys(FILTER_KEYS) as IndicatorScopeFilter[]).map((filter) => (
          <TabsTrigger key={filter} value={filter}>
            {t(FILTER_KEYS[filter] as Parameters<typeof t>[0], { count: counts[filter] })}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
