"use client";

import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuChevronRight, LuPlus, LuInfo } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Topic, TopicIndicator } from "@/app/local-api/topics/route";
import { useSyncTopics } from "@/app/store";

import Info from "@/containers/info";
import { VisualizationTypes } from "@/containers/report/indicators/sidebar/topics/indicators/visualization-types";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { Badges } from "./badges";

export function IndicatorsItem({ topic, indicator }: { topic: Topic; indicator: TopicIndicator }) {
  const [open, setOpen] = useState(true);

  const [topics] = useSyncTopics();

  const selectedTopicIndicators = topics?.find(({ id }) => id === topic.id)?.indicators;
  const selectedIndicator = selectedTopicIndicators?.find(({ id }) => id === indicator.id);

  return (
    <Collapsible open={open && !!selectedIndicator} className="flex w-full flex-col">
      <div className="flex justify-between">
        <CollapsibleTrigger asChild>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              className="flex w-full min-w-28 cursor-pointer items-center space-x-1 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
              disabled={!selectedIndicator}
            >
              <LuChevronRight
                className={cn({
                  "h-4 w-4 transition-transform duration-200": true,
                  "rotate-90": open,
                  "rotate-0 opacity-50": !selectedIndicator,
                })}
              />

              <span className="text-left">{indicator.name}</span>
            </button>
            <Tooltip>
              <Dialog>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <button aria-label="Topic info" type="button">
                      <LuInfo className="h-full w-full" />
                    </button>
                  </DialogTrigger>
                </TooltipTrigger>

                <DialogContent className="p-0">
                  <DialogTitle className="sr-only">{indicator.description_short}</DialogTitle>
                  <Info ids={[indicator.id]} />
                  <DialogClose />
                </DialogContent>

                <TooltipPortal>
                  <TooltipContent side="left" align="center">
                    <div className="text-xxs">
                      {indicator.description_short || "About the data"}
                    </div>

                    <TooltipArrow className="fill-foreground" width={10} height={5} />
                  </TooltipContent>
                </TooltipPortal>
              </Dialog>
            </Tooltip>
          </div>
        </CollapsibleTrigger>

        <Popover>
          <PopoverTrigger className="flex h-5 w-5 items-center justify-center rounded-sm bg-secondary">
            <LuPlus />
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="w-auto bg-background p-2">
            <VisualizationTypes
              topicId={topic.id}
              types={indicator.visualization_types}
              indicatorId={indicator.id}
            />
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

        <Badges topicId={topic.id} indicatorId={indicator.id} />
      </CollapsibleContent>
    </Collapsible>
  );
}
