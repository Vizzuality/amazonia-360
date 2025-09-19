"use client";

import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuChevronRight, LuPlus, LuInfo } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Indicator, VisualizationTypes } from "@/types/indicator";
import { Topic } from "@/types/topic";

import { useSyncTopics } from "@/app/store";

import Info from "@/containers/info";
import { VisualizationType } from "@/containers/results/sidebar/indicators/list/visualization-types";

import { Button } from "@/components/ui/button";
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

export function IndicatorsItem({
  topicId,
  indicator,
}: {
  topicId: Topic["id"];
  indicator: Indicator;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(true);

  const [topics] = useSyncTopics();

  const selectedTopicIndicators = topics?.find(({ id }) => id === topicId)?.indicators;
  const selectedIndicator = selectedTopicIndicators?.find(({ id }) => id === indicator.id);

  return (
    <Collapsible open={open && !!selectedIndicator} className="flex w-full flex-col">
      <div className="flex justify-between">
        <CollapsibleTrigger
          className="flex w-full min-w-28 cursor-pointer items-center space-x-1 text-sm"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          disabled={!selectedIndicator}
        >
          <LuChevronRight
            className={cn({
              "h-4 w-4 shrink-0 transition-transform duration-200": true,
              "rotate-90": open,
              "rotate-0 opacity-50": !selectedIndicator,
            })}
          />

          <span className="text-left">{indicator.name}</span>
        </CollapsibleTrigger>
        <div className="flex shrink-0 items-center space-x-2">
          <Tooltip>
            <Dialog>
              <TooltipTrigger asChild>
                <DialogTrigger>
                  <LuInfo className="h-full w-full shrink-0" aria-label="Topic info" />
                </DialogTrigger>
              </TooltipTrigger>

              <DialogContent className="max-w-2xl p-0">
                <DialogTitle className="sr-only">{indicator.description_short}</DialogTitle>
                <Info ids={[indicator.id]} />
                <DialogClose />
              </DialogContent>

              <TooltipPortal>
                <TooltipContent side="left" align="center" className="max-w-72">
                  <div className="text-xxs">
                    {indicator.description_short || t("about-the-data")}
                  </div>

                  <TooltipArrow className="fill-foreground" width={10} height={5} />
                </TooltipContent>
              </TooltipPortal>
            </Dialog>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label={t("visualization-type")}
                type="button"
                variant="secondary"
                className="h-5 w-5 rounded-sm p-0"
              >
                <LuPlus />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-auto bg-background p-0">
              <VisualizationType
                topicId={topicId}
                types={indicator.visualization_types as Exclude<VisualizationTypes, "ai">[]}
                indicatorId={indicator.id}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <CollapsibleContent className="flex items-center space-x-2 pl-1.5">
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

        <Badges topicId={topicId} indicatorId={indicator.id} />
      </CollapsibleContent>
    </Collapsible>
  );
}
