"use client";

import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { LuChevronRight, LuPlus } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { Topic } from "@/constants/topics";

import { VisualizationTypes } from "@/containers/report/visualization-types";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Visualizations, VisualizationType } from "../visualization-types/types";

import { Badges } from "./badges";

export function TopicsReportItem({
  topic,
  indicator,
}: {
  topic: Topic;
  indicator: {
    value: string;
    label: string;
  };
}) {
  const [open, setOpen] = useState(true);

  const VISUALIZATION_TYPES: VisualizationType[] = ["map", "table", "chart", "numeric"];

  const MOCKED: Visualizations = {
    available: VISUALIZATION_TYPES,
    default: "map",
  };

  const [indicators] = useSyncTopics();

  const selectedTopicIndicators = indicators?.find(({ id }) => id === topic.id)?.indicators;
  const selectedIndicator = selectedTopicIndicators?.find(({ id }) => id === indicator.value);

  return (
    <Collapsible open={open && !!selectedIndicator} className="flex w-full flex-col pl-4">
      <div className="flex justify-between">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full min-w-28 cursor-pointer items-center space-x-1 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            disabled={!selectedIndicator}
          >
            {!!selectedIndicator && (
              <LuChevronRight
                className={cn({
                  "h-4 w-4 transition-transform duration-200": true,
                  "rotate-90": open,
                  "opacity-50": !selectedIndicator,
                })}
              />
            )}
            <span>{indicator.label}</span>
          </button>
        </CollapsibleTrigger>

        <Popover>
          <PopoverTrigger>
            <LuPlus className="h-5 w-5 cursor-pointer" />
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="w-auto bg-background p-2">
            <VisualizationTypes topicId={topic.id} types={MOCKED} indicatorId={indicator.value} />
          </PopoverContent>
        </Popover>
      </div>

      <CollapsibleContent className="flex items-center space-x-2 pl-1 pt-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="7"
          height="10"
          viewBox="0 0 7 10"
          fill="none"
        >
          <path
            d="M1 1.00012V4.00012C1 6.76155 3.23858 9.00012 6 9.00012V9.00012"
            stroke="#CBD8DF"
            strokeLinecap="round"
          />
        </svg>

        <Badges topicId={topic.id} indicatorId={indicator.value} />
      </CollapsibleContent>
    </Collapsible>
  );
}
