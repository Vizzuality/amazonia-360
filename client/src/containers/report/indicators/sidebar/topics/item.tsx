"use client";

import { useState, useCallback } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuChevronRight, LuGripVertical } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Topic } from "@/app/api/topics/route";
import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

import { Indicators } from "@/containers/report/indicators/sidebar/topics/indicators";

import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CounterIndicatorsPill } from "./counter-indicators-pill";

export function TopicItem({ topic, id }: { topic: Topic; id: number }) {
  const [topics, setTopics] = useSyncTopics();
  const [open, setOpen] = useState(false);

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

  const handleResetTopic = useCallback(() => {
    setTopics((prev) => {
      const t = topics?.find((t) => t.id === topic.id);
      if (!prev || !t) return prev ?? [];

      const index = prev.findIndex((t) => t.id === topic.id);
      if (index === -1) return prev;

      prev[index] = {
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

      return prev;
    });
  }, [topic, setTopics, topics]);

  return (
    <li
      key={id}
      className={cn({
        "flex flex-col": true,
        "b-2 box-border border-b border-b-primary/20": open,
      })}
    >
      <Collapsible open={open}>
        <div
          className={cn({
            "flex h-10 items-center space-x-4 rounded-[2px] px-0.5 py-2 hover:bg-secondary": true,
          })}
        >
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

                <span className="whitespace flex-nowrap text-sm">{topic.name}</span>

                <CounterIndicatorsPill id={topic.id} />
              </div>
            </div>
          </CollapsibleTrigger>
          <Switch
            checked={!!topics?.find((t) => t.id === topic.id)}
            onCheckedChange={(e) => handleTopic(topic, e)}
            id={`${topic.id}`}
            value={topic.id}
            className="h-4 w-8"
          />
        </div>
        <CollapsibleContent>
          <Indicators topic={topic} />

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
                  <div className="max-w-40">
                    Clear all widgets and set’s the topic to it’s default view
                  </div>
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
