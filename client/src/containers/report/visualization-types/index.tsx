"use client";

import { MapIcon, TableIcon, PieChart, Binary } from "lucide-react";

import { useGridstackContext } from "@/lib/dynamic-grid/use-gridstack-context";
import { cn } from "@/lib/utils";

import { useSyncIndicators } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic } from "@/constants/topics";

// import { buttonVariants } from "@/components/ui/button";

import { Visualizations } from "./types";

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
  const { grid } = useGridstackContext();

  const handleVisualizationType = (types: Visualizations["default"]) => {
    const newIndicators = [...(indicators || [])];

    const widgetSize = DEFAULT_VISUALIZATION_SIZES[types];

    const widgetDiv = document.createElement("div");
    widgetDiv.classList.add("grid-stack-item-content");
    widgetDiv.setAttribute("gs-auto-position", "true");
    widgetDiv.setAttribute("gs-w", widgetSize[0].toString());
    widgetDiv.setAttribute("gs-h", widgetSize[1].toString());

    grid?.el.appendChild(widgetDiv);
    grid?.makeWidget(widgetDiv);

    // Find topic
    const topicIndex = newIndicators.findIndex((topic) => topic.id === topicId);

    const newIndicator = {
      type: types,
      id: indicatorId,
      size: DEFAULT_VISUALIZATION_SIZES[types],
    };

    if (topicIndex >= 0) {
      // Find indicators within this topic
      const indicatorsArray = [...newIndicators[topicIndex].indicators];

      const existingIndicatorIndex = indicatorsArray.findIndex(
        (indicator) => indicator.id === indicatorId && indicator.type === types,
      );

      if (existingIndicatorIndex >= 0) {
        // Replace the existing indicator with the same id and type
        indicatorsArray[existingIndicatorIndex] = newIndicator;
      } else {
        // Add the new indicator if no exact match (different type or new id)
        indicatorsArray.push(newIndicator);
      }

      // Update the indicators for the topic
      newIndicators[topicIndex] = {
        ...newIndicators[topicIndex],
        indicators: indicatorsArray,
      };
    } else {
      newIndicators.push({
        id: topicId,
        indicators: [newIndicator],
      });
    }

    setIndicators(newIndicators);
  };

  return (
    <>
      <span className="text-muted-foreground text-xs font-semibold">
        Visualization types
      </span>
      <ul className="flex flex-col">
        {types.available.map((b) => {
          return (
            <li key={b} className="flex">
              <button
                type="button"
                onClick={() => handleVisualizationType(b)}
                className="space-x-2 flex items-center"
              >
                {b === "map" && <MapIcon className="w-4 h-4" />}
                {b === "table" && <TableIcon className="w-4 h-4" />}
                {b === "chart" && <PieChart className="w-4 h-4" />}
                {b === "numeric" && <Binary className="w-4 h-4" />}
                {/* TO DO - get icons for all visualizations */}
                <span
                  className={cn({
                    "text-foreground text-xs transition-colors capitalize font-semibold p-1 cursor-pointer":
                      true,
                  })}
                >
                  {b}
                </span>
                {/* {MOCKED.default.includes(b) && (
                  <span
                    className={cn(
                      buttonVariants({
                        variant: "secondary",
                        size: "sm",
                      }),
                      "rounded-full px-2.5",
                    )}
                  >
                    Recommended
                  </span>
                )} */}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
