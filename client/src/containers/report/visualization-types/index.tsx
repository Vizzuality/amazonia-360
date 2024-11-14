"use client";

import { MapIcon, TableIcon, PieChart, Binary } from "lucide-react";

import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic } from "@/constants/topics";

import { Visualizations, VisualizationType } from "./types";

const MOCKED: Visualizations = {
  available: ["map", "table", "chart", "numeric"],
  default: "map",
};

export function VisualizationTypes({
  types = MOCKED,
  indicatorId,
  topicId,
}: {
  types: Visualizations;
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

  return (
    <>
      <span className="text-xs font-semibold text-primary-foreground">Visualization types</span>
      <ul className="flex flex-col">
        {types.available.map((type) => (
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
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
