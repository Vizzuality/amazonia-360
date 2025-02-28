"use client";

import { useState, useCallback, useMemo, useEffect, MouseEvent } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuChevronRight, LuGripVertical } from "react-icons/lu";

import { useGetTopicsId } from "@/lib/topics";
import { cn, areArraysEqual } from "@/lib/utils";

import { Topic } from "@/app/local-api/topics/route";
import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

import { Indicators } from "@/containers/report/indicators/sidebar/topics/indicators";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CounterIndicatorsPill } from "./counter-indicators-pill";

export function TopicItem({ topic, id }: { topic: Topic; id: number }) {
  const [topics, setTopics] = useSyncTopics();
  const [counterVisibility, toggleCounterVisibility] = useState<boolean>(true);
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

  const handleResetTopic = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setTopics((prev) => {
        if (!prev) return [];

        return prev.map((existingTopic) =>
          existingTopic.id === topic.id
            ? {
                ...existingTopic,
                indicators:
                  topic.default_visualization?.map((indicator) => ({
                    id: indicator?.id,
                    type: indicator?.type,
                    x: indicator?.x ?? 0,
                    y: indicator?.y ?? 0,
                    w: indicator?.w ?? DEFAULT_VISUALIZATION_SIZES[indicator?.type]?.w,
                    h: indicator?.h ?? DEFAULT_VISUALIZATION_SIZES[indicator?.type]?.h,
                  })) ?? [],
              }
            : existingTopic,
        );
      });
    },
    [topic, setTopics],
  );

  const selectedTopicIndicators = useMemo(
    () => topics?.find(({ id }) => id === topic.id)?.indicators,
    [topics, topic],
  );

  const defaultTopic = useGetTopicsId(topic.id)?.default_visualization;

  const isTopicDefaultView = areArraysEqual(defaultTopic, selectedTopicIndicators);

  useEffect(() => {
    if (!selectedTopicIndicators?.length) {
      setTopics((prev) => prev?.filter((t) => t.id !== topic.id) || []);
    }
  }, [selectedTopicIndicators, topic.id, setTopics]);

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
            "flex h-10 items-center space-x-4 rounded-lg px-0.5 py-2 hover:bg-secondary": true,
          })}
        >
          <CollapsibleTrigger
            className="flex w-full min-w-28 items-center justify-between text-sm"
            asChild
          >
            <div
              className="flex w-full items-center justify-between text-sm"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(!open);
              }}
            >
              <div className="flex w-full flex-1 items-center justify-start space-x-1">
                <LuGripVertical className="shrink-0" />
                <LuChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                />
                <span className="whitespace w-full flex-1 flex-nowrap text-sm">
                  {topic.name_en}
                </span>
              </div>
              <div className="flex justify-end">
                {/* Case 1: Show Counter if closed and counter is visible OR if open and it's the default view */}
                {((!open && counterVisibility) || (open && isTopicDefaultView)) && (
                  <button
                    type="button"
                    onMouseEnter={() => {
                      if (!isTopicDefaultView) {
                        toggleCounterVisibility(false);
                      }
                    }}
                  >
                    <CounterIndicatorsPill id={topic.id} />
                  </button>
                )}
                {/* Case 2: Show Reset button when:
                - Counter is hidden, the panel is closed, and it's not the default view
                - OR the panel is open and it's not the default view */}
                {((!counterVisibility &&
                  !open &&
                  !isTopicDefaultView &&
                  !!topics?.find(({ id }) => id === topic.id)?.indicators) ||
                  (open &&
                    !isTopicDefaultView &&
                    !!topics?.find(({ id }) => id === topic.id)?.indicators)) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="xs"
                        type="button"
                        onClick={(e) => {
                          handleResetTopic(e);
                          toggleCounterVisibility(true); // Ensure Counter reappears after reset
                        }}
                        className="rounded-full text-xs"
                        onMouseLeave={() => toggleCounterVisibility(true)}
                      >
                        Reset
                      </Button>
                    </TooltipTrigger>

                    <TooltipPortal>
                      <TooltipContent side="top" align="end">
                        <div className="max-w-40">
                          Clear all widgets and set the topic to its default view
                        </div>
                        <TooltipArrow className="fill-foreground" width={10} height={5} />
                      </TooltipContent>
                    </TooltipPortal>
                  </Tooltip>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <Switch
            checked={!!topics?.find((t) => t.id === topic.id) && !!selectedTopicIndicators?.length}
            onCheckedChange={(e) => handleTopic(topic, e)}
            id={`${topic.id}`}
            value={topic.id}
            className="h-4 w-8"
          />
        </div>
        <CollapsibleContent>
          <Indicators topic={topic} />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
