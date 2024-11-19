"use client";

import { MapIcon, TableIcon, PieChart, Binary } from "lucide-react";

import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic, TOPICS } from "@/constants/topics";

import { VisualizationType } from "./types";

export function VisualizationTypes({
  types = ["map", "table", "chart", "numeric"],
  indicatorId,
  topicId,
}: {
  types: VisualizationType[];
  indicatorId: string;
  topicId: Topic["id"];
}) {
  const [topics, setTopics] = useSyncTopics();

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
      const indicatorsArray = [...newTopics[topicIndex].indicators];

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

  const defaultVizualizations = TOPICS?.find(({ id }) => id === topicId)?.default_visualization;

  const defaultVizualizationsPerIndicator = defaultVizualizations?.find(
    ({ id }) => id === indicatorId,
  )?.type;

  return (
    <>
      <span className="text-xs font-semibold text-secondary">Visualization types</span>
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
              {type === "chart" && <PieChart className="h-4 w-4" />}
              {type === "numeric" && <Binary className="h-4 w-4" />}
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
