"use client";

import { MapIcon, TableIcon, PieChartIcon, HashIcon } from "lucide-react";

import { useIndicators } from "@/lib/indicators";
import {
  // useGetTopics,
  useGetTopicsFromIndicators,
} from "@/lib/topics";
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
  // const { data: topicsData } = useGetTopics();
  const { data: indicatorsData } = useIndicators();
  const topicsData = useGetTopicsFromIndicators(indicatorsData);

  const handleVisualizationType = (visualizationType: VisualizationType) => {
    const widgetSize = DEFAULT_VISUALIZATION_SIZES[visualizationType];
    const newTopics = [...(topics || [])];

    const topicIndex = newTopics.findIndex((topic) => topic.id === topicId);
    const newIndicator = {
      type: visualizationType,
      id: indicatorId,
      w: widgetSize.w,
      h: widgetSize.h,
    };

    if (topicIndex >= 0) {
      const indicatorsArray = [...(newTopics[topicIndex].indicators || [])];

      const exists = indicatorsArray.some(
        (indicator) => indicator.id === indicatorId && indicator.type === visualizationType,
      );

      if (!exists) {
        newTopics[topicIndex] = {
          ...newTopics[topicIndex],
          indicators: [...indicatorsArray, newIndicator],
        };
      }
    } else {
      newTopics.push({ id: topicId, indicators: [newIndicator] });
    }
    setTopics(newTopics);
  };

  const defaultVizualizations = topicsData?.find(({ id }) => id === topicId)?.default_visualization;

  const defaultVizualizationsPerIndicator = defaultVizualizations?.find(
    ({ id }) => id === indicatorId,
  )?.type;

  return (
    <>
      <span className="text-xs font-semibold text-primary">Visualization types</span>
      <ul className="flex flex-col">
        {types.map((type) => (
          <li key={type} className="flex">
            <button
              type="button"
              onClick={() => handleVisualizationType(type)}
              className="flex items-center space-x-2"
            >
              {type === "map" && <MapIcon className="h-4 w-4" />}
              {type === "table" && <TableIcon className="h-4 w-4" />}
              {type === "chart" && <PieChartIcon className="h-4 w-4" />}
              {type === "numeric" && <HashIcon className="h-4 w-4" />}
              <span
                className={cn({
                  "cursor-pointer p-1 text-xs font-semibold capitalize text-foreground transition-colors":
                    true,
                })}
              >
                {type}
              </span>
              {defaultVizualizationsPerIndicator === type && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                  Default
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
