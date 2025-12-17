"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuChartPie, LuHash, LuMap, LuTable } from "react-icons/lu";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { findFirstAvailablePosition } from "@/lib/report";
import { cn } from "@/lib/utils";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import { IndicatorView } from "@/app/(frontend)/parsers";
import { useSyncTopics } from "@/app/(frontend)/store";

import { DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

import { Search } from "@/components/ui/search";
import { Switch } from "@/components/ui/switch";

type Option = Indicator & {
  label?: string;
  value: string;
  key: string;
  active?: boolean;
  sourceIndex: number;
  group: {
    id: number;
    label: string;
  };
};

export default function SearchC() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { topics, setTopics } = useSyncTopics();

  const queryIndicators = useGetDefaultIndicators({ locale });

  const ICON_COMPONENTS = {
    map: LuMap,
    table: LuTable,
    chart: LuChartPie,
    numeric: LuHash,
  } as Record<VisualizationTypes, React.ElementType>;

  const DATA = useMemo(() => {
    return (
      queryIndicators.data
        ?.filter((indicator) => indicator.topic.id !== 0)
        ?.map((indicator) => {
          if (!!indicator.visualization_types && Array.isArray(indicator.visualization_types)) {
            return indicator.visualization_types.map((v) => {
              const isActive = topics?.some((topic) =>
                topic?.indicators?.some(
                  (topicIndicator) =>
                    topicIndicator.indicator_id === indicator.id && topicIndicator.type === v,
                ),
              );

              return {
                ...indicator,
                key: v,
                label: indicator.name,
                value: `${indicator.name}-${v}`,
                sourceIndex: indicator.id,
                active: isActive,
                group: {
                  id: indicator.topic.id,
                  label: indicator.topic.name ?? "",
                },
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
            o.key.toLowerCase().includes(search.toLowerCase()) ||
            o.label?.toLowerCase().includes(search.toLowerCase()) ||
            o.topic.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.subtopic.name?.toLowerCase().includes(search.toLowerCase()),
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

      if (value.active) {
        // Remove indicator
        setTopics((prev) => {
          if (!prev) return prev;

          const newTopics = [...prev];
          const i = newTopics.findIndex((topic) => topic.topic_id === value.topic.id);

          if (i === -1) return newTopics;

          const indicators = [...(newTopics[i]?.indicators || [])].filter(
            (indicator) => !(indicator.indicator_id === value.id && indicator.type === value.key),
          );

          newTopics[i] = {
            ...newTopics[i],
            indicators,
          };

          return newTopics;
        });
      } else {
        // Add indicator
        const widgetSize = DEFAULT_VISUALIZATION_SIZES[value.key as IndicatorView["type"]];
        const newIndicator = {
          type: value.key as IndicatorView["type"],
          id: `${value.id}-${value.key}`,
          indicator_id: value.id,
          x: 0,
          y: 0,
          w: DEFAULT_VISUALIZATION_SIZES[value.key as IndicatorView["type"]]?.w || 2,
          h: DEFAULT_VISUALIZATION_SIZES[value.key as IndicatorView["type"]]?.h || 2,
        };

        setTopics((prev) => {
          if (!prev) return prev;

          const newTopics = [...prev];
          const i = newTopics.findIndex((topic) => topic.topic_id === value.topic.id);

          if (i === -1) {
            newTopics.push({
              id: `${value.topic.id}`,
              topic_id: value.topic.id,
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
      }
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
        {(o) => {
          const Icon = ICON_COMPONENTS[o.key as VisualizationTypes];

          return (
            <div
              className={cn({
                "flex w-full cursor-pointer items-start justify-between gap-2 py-1 text-xs": true,
              })}
              role="button"
            >
              <div className="flex items-start gap-2">
                {!!Icon && <Icon className="h-4 w-4" />}
                <span>{o.label}</span>
              </div>

              <Switch className="h-4 w-8" checked={o.active} />
            </div>
          );
        }}
      </Search>
    </div>
  );
}
