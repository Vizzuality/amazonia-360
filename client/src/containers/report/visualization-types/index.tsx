"use client";

import { MapIcon, TableIcon, PieChart, Binary } from "lucide-react";

import { cn } from "@/lib/utils";

import { useSyncIndicators } from "@/app/store";

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
  const [indicators, setIndicators] = useSyncIndicators();

  const handleVisualizationType = (visualizationType: VisualizationType) => {
    const widgetSize = DEFAULT_VISUALIZATION_SIZES[visualizationType];

    const newIndicators = [...(indicators || [])];
    const topicIndex = newIndicators.findIndex((topic) => topic.id === topicId);
    const newIndicator = { type: visualizationType, id: indicatorId, size: widgetSize };

    if (topicIndex >= 0) {
      const indicatorsArray = [...newIndicators[topicIndex].indicators];
      const existingIndicatorIndex = indicatorsArray.findIndex(
        (indicator) => indicator.id === indicatorId && indicator.type === visualizationType,
      );

      if (existingIndicatorIndex >= 0) {
        indicatorsArray[existingIndicatorIndex] = newIndicator;
      } else {
        indicatorsArray.push(newIndicator);
      }

      newIndicators[topicIndex] = { ...newIndicators[topicIndex], indicators: indicatorsArray };
    } else {
      newIndicators.push({ id: topicId, indicators: [newIndicator] });
    }

    setIndicators(newIndicators);
  };

  return (
    <>
      <span className="text-xs font-semibold text-muted-foreground">Visualization types</span>
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
