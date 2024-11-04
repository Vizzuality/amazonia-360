"use client";

import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { LuChevronRight, LuPlus } from "react-icons/lu";

import { Topic } from "@/constants/topics";

import { VisualizationTypes } from "@/containers/report/visualization-types";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Visualizations,
  VisualizationType,
} from "../visualization-types/types";

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

  const VISUALIZATION_TYPES: VisualizationType[] = [
    "map",
    "table",
    "chart",
    "numeric",
  ];

  const MOCKED: Visualizations = {
    available: VISUALIZATION_TYPES,
    default: "map",
  };

  return (
    <Collapsible open={open} className="w-full px-4 flex flex-col">
      <div className="flex justify-between">
        <CollapsibleTrigger asChild>
          <div
            className="text-sm min-w-28 w-full flex space-x-1 items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            <LuChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
            <span>{indicator.label}</span>
          </div>
        </CollapsibleTrigger>

        <Popover>
          <PopoverTrigger>
            <LuPlus className="w-5 h-5 cursor-pointer" />
          </PopoverTrigger>
          <PopoverContent
            side="left"
            align="start"
            className="bg-background w-auto p-2"
          >
            <VisualizationTypes
              topicId={topic.id}
              types={MOCKED}
              indicatorId={indicator.value}
            />
          </PopoverContent>
        </Popover>
      </div>

      <CollapsibleContent className="pt-2">
        <Badges topicId={topic.id} indicatorId={indicator.value} />
      </CollapsibleContent>
    </Collapsible>
  );
}
