"use client";

import { useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuChartPie, LuHash, LuMap, LuTable } from "react-icons/lu";

import { findFirstAvailablePosition } from "@/lib/report";
import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";
import { VisualizationTypes } from "@/types/indicator";

import { useSyncTopics } from "@/app/(frontend)/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic } from "@/constants/topics";

export function VisualizationType({
  types = ["map", "table", "chart", "numeric"],
  indicatorId,
  topicId,
}: {
  types: Exclude<VisualizationTypes, "ai" | "custom">[];
  indicatorId: Indicator["id"];
  topicId: Topic["id"];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [topics, setTopics] = useSyncTopics();
  const { data: subtopicsData } = useGetDefaultSubtopics({ locale, topicId });

  const handleVisualizationType = (visualizationType: VisualizationTypes) => {
    const widgetSize = DEFAULT_VISUALIZATION_SIZES[visualizationType];

    const newIndicator = {
      type: visualizationType,
      id: `${indicatorId}`,
      indicator_id: indicatorId,
      x: 0,
      y: 0,
      w: widgetSize.w,
      h: widgetSize.h,
    };

    setTopics((prev) => {
      if (!prev) return prev;

      const newTopics = [...prev];

      const i = newTopics.findIndex((topic) => topic.topic_id === topicId);

      if (i === -1) {
        newTopics.push({
          id: `${topicId}`,
          topic_id: topicId,
          indicators: [newIndicator],
        });

        return newTopics;
      }

      const indicators = newTopics[i].indicators || [];

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
  };

  const defaultVisualizations = useMemo(
    () =>
      subtopicsData
        ?.filter((s) => s.topic_id === topicId)
        .map((s) => s.default_visualization)
        .flat() || [],
    [subtopicsData, topicId],
  );

  const defaultVisualizationsPerIndicator = useMemo(
    () => defaultVisualizations?.find(({ indicator_id }) => indicator_id === indicatorId)?.type,
    [defaultVisualizations, indicatorId],
  );

  const activeVisualizationsPerIndicatorAndTopic = useMemo(
    () => topics?.find(({ topic_id }) => topic_id === topicId)?.indicators,
    [topics, topicId],
  );

  const ICON_COMPONENTS = {
    map: LuMap,
    table: LuTable,
    chart: LuChartPie,
    numeric: LuHash,
  };

  return (
    <div className="p-1">
      <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/90">
        {t("visualization-type")}
      </span>
      <ul className="flex flex-col">
        {types.map((type) => {
          const isDisabled = !!activeVisualizationsPerIndicatorAndTopic?.find(
            ({ indicator_id, type: activeType }) =>
              indicator_id === indicatorId && activeType === type,
          );

          const Icon = ICON_COMPONENTS[type];

          return (
            <li key={type}>
              <button
                type="button"
                className={cn({
                  "flex w-full items-center space-x-2 rounded-[2px] px-2 py-1.5 hover:bg-blue-100": true,
                  "pointer-events-none cursor-none opacity-50": isDisabled,
                })}
                disabled={isDisabled}
                onClick={() => handleVisualizationType(type)}
              >
                {!!Icon && <Icon className="h-4 w-4" />}

                <span
                  className={cn({
                    "text-xs font-semibold capitalize text-foreground transition-colors hover:text-accent-foreground": true,
                  })}
                >
                  {t(`${type}`)}
                </span>

                {defaultVisualizationsPerIndicator === type && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                    {t("default")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
