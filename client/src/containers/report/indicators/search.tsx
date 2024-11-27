"use client";

import { useCallback, useState } from "react";

import { useIndicators } from "@/lib/indicators";
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
  const indicators = useIndicators();

  const { data: indicatorsData } = indicators;

  const q =
    indicatorsData
      ?.map((indicator) =>
        indicator.visualization_types.map((v) => {
          const isActive = topics?.some((topic) =>
            topic?.indicators?.some(
              (topicIndicator) => topicIndicator.id === indicator.id && topicIndicator.type === v,
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
      .flat() || [];

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
      setTopics((prevTopics) => {
        const topicId = value.topicId;
        const indicatorId = value.indicatorId;
        const visualizationType = value.key as IndicatorView["type"];
        const existingTopic = prevTopics?.find((t) => t.id === topicId);

        if (!existingTopic) {
          const newTopic = {
            id: topicId,
            indicators: [
              {
                id: indicatorId,
                type: visualizationType,
                x: 0,
                y: 0,
                w: DEFAULT_VISUALIZATION_SIZES[visualizationType]?.w || 2,
                h: DEFAULT_VISUALIZATION_SIZES[visualizationType]?.h || 2,
              },
            ],
          };
          return [...(prevTopics || []), newTopic];
        }

        const existingIndicator = existingTopic.indicators?.find(
          (indicator) => indicator.id === indicatorId && indicator.type === visualizationType,
        );

        if (!existingIndicator) {
          const updatedTopic = {
            ...existingTopic,
            indicators: [
              ...(existingTopic.indicators || []),
              {
                id: indicatorId,
                type: visualizationType,
                x: 0,
                y: 0,
                w: DEFAULT_VISUALIZATION_SIZES[visualizationType]?.w || 2,
                h: DEFAULT_VISUALIZATION_SIZES[visualizationType]?.h || 2,
              },
            ],
          };

          return prevTopics?.map((t) => (t.id === topicId ? updatedTopic : t)) || null;
        }

        return prevTopics || null;
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
        options={q}
        {...indicators}
        onChange={handleSearch}
        onSelect={handleSelect}
        size="sm"
      >
        {(o) => (
          <div
            className={cn({
              "flex w-full cursor-pointer justify-between py-1.5 text-sm": true,
              "cursor-none opacity-50": o.active,
            })}
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
