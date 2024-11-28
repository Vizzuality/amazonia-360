"use client";

import { useMemo } from "react";

import { MapIcon, TableIcon, PieChartIcon, HashIcon } from "lucide-react";

import { findFirstAvailablePosition } from "@/lib/report";
import { useGetTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { Indicator } from "@/app/api/indicators/route";
import { VisualizationType } from "@/app/api/indicators/route";
import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic } from "@/constants/topics";

export function VisualizationTypes({
  types = ["map", "table", "chart", "numeric"],
  indicatorId,
  topicId,
}: {
  types: VisualizationType[];
  indicatorId: Indicator["id"];
  topicId: Topic["id"];
}) {
  const [topics, setTopics] = useSyncTopics();
  const { data: topicsData } = useGetTopics();

  const handleVisualizationType = (visualizationType: VisualizationType) => {
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
    <>
      <span className="text-xs font-semibold text-primary">Visualization types</span>
      <ul className="flex flex-col">
        {types.map((type) => {
          const isDisabled = !!activeVisualizationsPerIndicatorAndTopic?.find(
            ({ id, type: activeType }) => id === indicatorId && activeType === type,
          );

          const Icon = iconComponents[type];

          return (
            <li key={type} className="flex rounded-[2px] px-1 hover:bg-primary/20">
              <button
                type="button"
                className={cn({
                  "flex items-center space-x-2": true,
                  "cursor-none opacity-50": isDisabled,
                })}
                disabled={isDisabled}
                onClick={() => handleVisualizationType(type)}
              >
                {Icon && <Icon className="h-4 w-4" />}

                <span
                  className={cn({
                    "p-1 text-xs font-semibold capitalize text-foreground transition-colors": true,
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
    </>
  );
}
