"use client";

import { useCallback, useState } from "react";

import { useIndicators } from "@/lib/indicators";
import { findFirstAvailablePosition } from "@/lib/report";
import { cn } from "@/lib/utils";

import { IndicatorView } from "@/app/parsers";
import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

import { Search } from "@/components/ui/search";

type Option = {
  topicId: number;
  indicatorId: number;
  label: string;
  value: string;
  key: string;
  sourceIndex: number;
  active?: boolean;
};

export default function SearchC() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useSyncTopics();
  const queryIndicators = useIndicators({
    select(data) {
      return (
        data
          ?.map((indicator) =>
            indicator.visualization_types.map((v) => {
              const isActive = topics?.some((topic) =>
                topic?.indicators?.some(
                  (topicIndicator) =>
                    topicIndicator.id === indicator.id && topicIndicator.type === v,
                ),
              );
              return {
                topicId: indicator.topic.id,
                indicatorId: indicator.id,
                label: indicator.name,
                value: `${indicator.name}-${v}`,
                key: v,
                sourceIndex: indicator.id,
                active: isActive,
              };
            }),
          )
          .flat() || []
      );
    },
  });

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
        if (!prev) return prev;

        const i = prev.findIndex((topic) => topic.id === value.topicId);

        if (i === -1) {
          prev.push({
            id: value.topicId,
            indicators: [newIndicator],
          });

          return prev;
        }

        const indicators = prev[i].indicators || [];

        const position = findFirstAvailablePosition(indicators, widgetSize, 4);
        newIndicator.x = position.x;
        newIndicator.y = position.y;
        indicators.push(newIndicator);

        prev[i] = {
          ...prev[i],
          indicators,
        };

        return prev;
      });
    },
    [setTopics],
  );

  return (
    <div className="w-full py-2">
      <Search
        value={search}
        open={open}
        placeholder="Search indicator..."
        options={queryIndicators.data || []}
        {...queryIndicators}
        onChange={handleSearch}
        onSelect={handleSelect}
        size="sm"
      >
        {(o) => (
          <div
            className={cn({
              "flex w-full cursor-pointer justify-between py-1.5 text-sm": true,
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
