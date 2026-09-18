"use client";

import { useMemo } from "react";

import { useTranslations } from "next-intl";
import { LuChartPie, LuHash, LuMap, LuTable } from "react-icons/lu";

import { findFirstAvailablePosition } from "@/lib/report";
import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";
import { VisualizationTypes } from "@/types/indicator";
import { Topic } from "@/types/topic";

import { useFormTopics } from "@/app/(frontend)/store";

import { DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

export function VisualizationType({
  types = ["map", "table", "chart", "numeric"],
  indicatorId,
  topicId,
  defaultType,
}: {
  types: Exclude<VisualizationTypes, "ai" | "custom">[];
  indicatorId: Indicator["id"];
  topicId: Topic["id"];
  defaultType: Indicator["default_visualization_type"];
}) {
  const t = useTranslations();
  const { topics, setTopics } = useFormTopics();

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
      <span className="text-muted-foreground/90 px-2 py-1.5 text-xs font-semibold">
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
                  "flex w-full items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-blue-100": true,
                  "pointer-events-none cursor-none opacity-50": isDisabled,
                })}
                disabled={isDisabled}
                onClick={() => handleVisualizationType(type)}
              >
                {!!Icon && <Icon className="h-4 w-4" />}

                <span
                  className={cn({
                    "text-foreground hover:text-accent-foreground text-xs font-semibold capitalize transition-colors": true,
                  })}
                >
                  {t(`${type}`)}
                </span>

                {defaultType === type && (
                  <span className="bg-secondary rounded-full px-2.5 py-0.5 text-xs font-semibold">
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
