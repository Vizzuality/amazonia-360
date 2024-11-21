"use client";

import { useState, useCallback, useMemo } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuChevronRight, LuGripVertical } from "react-icons/lu";

import { useGetTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic } from "@/constants/topics";

import { CounterIndicatorsPill } from "@/containers/report/indicators/counter-indicators-pill";

import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { TopicsReportItem } from "./sidebar-topic-item";

export function TopicsReportItems({ topic, id }: { topic: Topic; id: string | number }) {
  const [topics, setTopics] = useSyncTopics();
  const [open, setOpen] = useState(false);

  const { data: topicsData } = useGetTopics();

  const handleTopic = useCallback(
    (topic: Topic, isChecked: boolean) => {
      setTopics((prevTopics) => {
        if (isChecked) {
          const newTopic = {
            id: topic.id,
            indicators: topic.default_visualization?.map((indicator) => {
              return {
                id: indicator?.id,
                type: indicator?.type,
                x: indicator?.x || 0,
                y: indicator?.y || 0,
                w: indicator?.w || DEFAULT_VISUALIZATION_SIZES[indicator?.type].w,
                h: indicator?.h || DEFAULT_VISUALIZATION_SIZES[indicator?.type].h,
              };
            }),
          };
          return [...(prevTopics?.filter((t) => t.id !== topic.id) || []), newTopic];
        } else {
          return prevTopics?.filter((t) => t.id !== topic.id) || [];
        }
      });
    },
    [setTopics],
  );

  const activeIndicators = useMemo(() => {
    return topics?.find(({ id }) => id === topic.id)?.indicators;
  }, [topics, topic.id]);

  const selectedIndicators = useMemo(() => {
    return activeIndicators?.map(({ id }) => id);
  }, [activeIndicators]);

  const handleResetTopic = useCallback(() => {
    setTopics((prevTopics) => {
      const updatedTopic = topics?.find((t) => t.id === topic.id);
      if (!prevTopics || !updatedTopic) return prevTopics ?? [];

      const index = prevTopics.findIndex((t) => t.id === topic.id);
      if (index === -1) return prevTopics;

      const updatedTopics = [...prevTopics];
      updatedTopics[index] = {
        ...prevTopics[index],
        ...updatedTopic,
      };

      return updatedTopics;
    });
  }, [topic.id, setTopics, topicsData, topics]);

  return (
    <li
      key={id}
      className={cn({
        "flex flex-col": true,
        "b-2 box-border border-b border-b-primary/20": open,
      })}
    >
      <Collapsible open={open}>
        <div className={cn({ "flex items-center space-x-4 py-2": true, "pb-0": open })}>
          <CollapsibleTrigger
            className="flex w-full min-w-28 items-center justify-between text-sm"
            asChild
            onClick={(event) => {
              event.stopPropagation();
              setOpen(!open);
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center justify-start space-x-1">
                <LuGripVertical className="shrink-0" />
                <LuChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                />

                <span className="whitespace flex-nowrap text-sm">{topic.label}</span>

                {!!selectedIndicators && (
                  <CounterIndicatorsPill activeIndicatorsLength={selectedIndicators?.length} />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <Switch
            checked={!!topics?.find((t) => t.id === topic.id)}
            onCheckedChange={(e) => handleTopic(topic, e)}
            id={topic.id as string}
            value={topic.id}
            className="h-4 w-8"
          />
        </div>
        <CollapsibleContent>
          <ul className="space-y-1 py-2 pl-6 text-sm font-medium">
            {topic?.indicators?.map((indicator) => (
              <li key={`${indicator.value}-${topic.id}`}>
                <TopicsReportItem {...{ topic, indicator }} />
              </li>
            ))}
          </ul>
          <div className="flex w-full justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleResetTopic}
                  className="py-1 text-xs font-semibold"
                >
                  Reset topic
                </button>
              </TooltipTrigger>

              <TooltipPortal>
                <TooltipContent side="top" align="end">
                  Clear all widgets and set’s the topic to it’s default view
                  <TooltipArrow className="fill-foreground" width={10} height={5} />
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
