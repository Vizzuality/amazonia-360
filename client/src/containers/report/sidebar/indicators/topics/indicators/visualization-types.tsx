"use client";

import { useMemo } from "react";

import { MapIcon, TableIcon, PieChartIcon, HashIcon } from "lucide-react";

import { findFirstAvailablePosition } from "@/lib/report";
import { useGetTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { Indicator } from "@/app/local-api/indicators/route";
import { VisualizationTypes } from "@/app/local-api/indicators/route";
import { useSyncTopics } from "@/app/store";

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
  const [topics, setTopics] = useSyncTopics();
  const { data: topicsData } = useGetTopics();

  const handleVisualizationType = (visualizationType: VisualizationTypes) => {
    const widgetSize = DEFAULT_VISUALIZATION_SIZES[visualizationType];

    const newIndicator = {
      type: visualizationType,
      id: indicatorId,
      x: 0,
      y: 0,
      w: widgetSize.w,
      h: widgetSize.h,
    };

    setTopics((prev) => {
      if (!prev) return prev;

      const i = prev.findIndex((topic) => topic.id === topicId);

      if (i === -1) {
        prev.push({
          id: topicId,
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
  };

  const defaultVisualizations = useMemo(
    () => topicsData?.find(({ id }) => id === topicId)?.default_visualization,
    [topicsData, topicId],
  );

  const defaultVisualizationsPerIndicator = useMemo(
    () => defaultVisualizations?.find(({ id }) => id === indicatorId)?.type,
    [defaultVisualizations, indicatorId],
  );

  const activeVisualizationsPerIndicatorAndTopic = useMemo(
    () => topics?.find(({ id }) => id === topicId)?.indicators,
    [topics, topicId],
  );

  const iconComponents = {
    map: MapIcon,
    table: TableIcon,
    chart: PieChartIcon,
    numeric: HashIcon,
  };
  return (
    <div className="p-1">
      <span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/90">
        Visualization type
      </span>
      <ul className="flex flex-col">
        {types.map((type) => {
          const isDisabled = !!activeVisualizationsPerIndicatorAndTopic?.find(
            ({ id, type: activeType }) => id === indicatorId && activeType === type,
          );

          const Icon = iconComponents[type];

          return (
            <li key={type}>
              <button
                type="button"
                className={cn({
                  "flex w-full items-center space-x-2 rounded-[2px] px-2 py-1.5 hover:bg-blue-100":
                    true,
                  "pointer-events-none cursor-none opacity-50": isDisabled,
                })}
                disabled={isDisabled}
                onClick={() => handleVisualizationType(type)}
              >
                {Icon && <Icon className="h-4 w-4" />}

                <span
                  className={cn({
                    "text-xs font-semibold capitalize text-foreground transition-colors hover:text-accent-foreground":
                      true,
                  })}
                >
                  {type}
                </span>

                {defaultVisualizationsPerIndicator === type && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                    Default
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
