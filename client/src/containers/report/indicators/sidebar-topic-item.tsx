"use client";

import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { LuChevronRight, LuPlus } from "react-icons/lu";

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
  const [open, setOpen] = useState(false);

  const VISUALIZATION_TYPES: VisualizationType[] = ["map", "table", "chart", "numeric"];

  const MOCKED: Visualizations = {
    available: VISUALIZATION_TYPES,
    default: "map",
  };

  return (
    <Collapsible open={open} className="flex w-full flex-col px-4">
      <div className="flex justify-between">
        <CollapsibleTrigger asChild>
          <div
            className="flex w-full min-w-28 cursor-pointer items-center space-x-1 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            <LuChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
            <span>{indicator.label}</span>
          </div>
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

      <CollapsibleContent className="pt-2">
        <Badges topicId={topic.id} indicatorId={indicator.value} />
      </CollapsibleContent>
    </Collapsible>
  );
}
