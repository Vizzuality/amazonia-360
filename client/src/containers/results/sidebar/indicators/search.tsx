"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { findFirstAvailablePosition } from "@/lib/report";
import { cn } from "@/lib/utils";

import { IndicatorView } from "@/app/parsers";
import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

import { Search } from "@/components/ui/search";

type Option = {
  topicId?: number;
  indicatorId: number;
  label?: string;
  value: string;
  key: string;
  active?: boolean;
};

export default function SearchC() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useSyncTopics();

  const queryIndicators = useGetDefaultIndicators({ locale });

  const DATA = useMemo(() => {
    return (
      queryIndicators.data
        ?.map((indicator) => {
          if (!!indicator.visualization_types && Array.isArray(indicator.visualization_types)) {
            return indicator.visualization_types.map((v) => {
              const isActive = topics?.some((topic) =>
                topic?.indicators?.some(
                  (topicIndicator) =>
                    topicIndicator.id === indicator.id && topicIndicator.type === v,
                ),
              );

              return {
                key: v,
                label: indicator.name,
                value: `${indicator.name}-${v}`,
                indicatorId: indicator.id,
                subtopicId: indicator.subtopic?.id,
                sourceIndex: indicator.id,
                active: isActive,
              };
            });
          }

          return [];
        })
        .flat() || []
    );
  }, [queryIndicators.data, topics]);

  const OPTIONS = useMemo(() => {
    if (search) {
      return (
        DATA?.filter(
          (o) =>
            o.label?.toLowerCase().includes(search.toLowerCase()) ||
            o.key.toLowerCase().includes(search.toLowerCase()),
        ) || []
      );
    }
    return DATA || [];
  }, [search, DATA]);

  const handleSearch = useCallback(
    (value: string) => {
      setOpen(true);
      setSearch(value);
    },
    [setSearch],
  );

  const handleSelect = useCallback(
    (value: Option | null) => {
      if (!value) {
        setOpen(false);
        setSearch("");
        return;
      }

      if (value.active) return;

      const widgetSize = DEFAULT_VISUALIZATION_SIZES[value.key as IndicatorView["type"]];
      const newIndicator = {
        type: value.key as IndicatorView["type"],
        id: value.indicatorId,
        x: 0,
        y: 0,
        w: DEFAULT_VISUALIZATION_SIZES[value.key as IndicatorView["type"]]?.w || 2,
        h: DEFAULT_VISUALIZATION_SIZES[value.key as IndicatorView["type"]]?.h || 2,
      };

      setTopics((prev) => {
        if (!prev || !value.topicId) return prev;

        const newTopics = [...prev];
        const i = newTopics.findIndex((topic) => topic.id === value.topicId);

        if (i === -1) {
          newTopics.push({
            id: value.topicId,
            indicators: [newIndicator],
          });

          return newTopics;
        }

        const indicators = [...(newTopics[i]?.indicators || [])];

        const position = findFirstAvailablePosition(indicators, widgetSize, 4);
        newIndicator.x = position.x;
        newIndicator.y = position.y;
        indicators.push(newIndicator);

        newTopics[i] = {
          ...newTopics[i],
          indicators,
        };

        return newTopics;
      });
    },
    [setTopics],
  );

  return (
    <div className="w-full py-2">
      <Search
        value={search}
        open={open}
        placeholder={`${t("grid-sidebar-report-location-filters-search")}...`}
        options={OPTIONS}
        {...queryIndicators}
        onChange={handleSearch}
        onSelect={(e) => handleSelect(e)}
        size="sm"
      >
        {(o) => (
          <div
            className={cn({
              "flex w-full cursor-pointer items-start justify-between gap-2 py-1 text-xs": true,
              "pointer-events-none opacity-50": o.active,
            })}
            role="button"
            aria-disabled={o.active}
          >
            <span>{o.label}</span>
            <span className="rounded-full bg-primary/20 px-2.5">{o.key}</span>
          </div>
        )}
      </Search>
    </div>
  );
}
