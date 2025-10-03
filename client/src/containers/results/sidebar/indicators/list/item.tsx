"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuPlus, LuInfo } from "react-icons/lu";

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
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  const [topics] = useSyncTopics();

  const selectedTopicIndicators = topics?.find(({ id }) => id === topicId)?.indicators;
  const selectedIndicator = selectedTopicIndicators?.find(({ id }) => id === indicator.id);

  return (
    <Popover>
      <div className="relative z-10 flex w-full flex-col">
        <div className="relative flex justify-between gap-2">
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              aria-label={indicator.name}
              className="h-auto w-full justify-start py-1 pl-2 pr-14 font-medium"
            >
              <span className="text-wrap text-left">{indicator.name}</span>
            </Button>
          </PopoverTrigger>

          <div className="pointer-events-none absolute right-0.5 top-1 mt-px flex items-center space-x-1">
            <Tooltip>
              <Dialog>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      aria-label={t("visualization-type")}
                      type="button"
                      variant="ghost"
                      className="pointer-events-auto h-5 w-5 rounded-sm p-0"
                    >
                      <LuInfo className="h-4 w-4" aria-label="Topic info" />
                    </Button>
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

            <PopoverAnchor asChild>
              <Button
                aria-label={t("visualization-type")}
                type="button"
                variant="secondary"
                className="h-5 w-5 rounded-sm p-0"
              >
                <LuPlus />
              </Button>
            </PopoverAnchor>

            <PopoverContent side="left" align="start" className="w-auto bg-background p-0">
              <VisualizationType
                topicId={topicId}
                types={indicator.visualization_types as Exclude<VisualizationTypes, "ai">[]}
                indicatorId={indicator.id}
              />
            </PopoverContent>
          </div>
        </div>

        {!!selectedIndicator && (
          <div className="flex items-center space-x-2 pl-2.5">
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
          </div>
        )}
      </div>
    </Popover>
  );
}
