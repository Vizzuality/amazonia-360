"use client";

import { useState, useCallback, useMemo, MouseEvent } from "react";

import Image from "next/image";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { LuChevronRight, LuGripVertical } from "react-icons/lu";

import { PLACEHOLDER } from "@/lib/images";
import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { cn, areArraysEqual } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { IndicatorView } from "@/app/parsers";
import { indicatorsExpandAtom, useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES } from "@/constants/topics";

import SubtopicList from "@/containers/results/sidebar/indicators/subtopics";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CounterIndicatorsPill } from "./counter-indicators-pill";

export function TopicItem({ topic, id }: { topic: Topic; id: number }) {
  const t = useTranslations();
  const locale = useLocale();

  const { name, image } = topic;

  const [topics, setTopics] = useSyncTopics();
  const [counterVisibility, toggleCounterVisibility] = useState<boolean>(true);
  const [open, setOpen] = useState(false);

  const { data: subtopicsData } = useGetDefaultSubtopics({ locale, topicId: topic.id });

  const handleTopic = useCallback(
    (topic: Topic, isChecked: boolean) => {
      setTopics((prevTopics) => {
        if (isChecked) {
          const newTopic = {
            id: topic.id,
            indicators: subtopicsData
              ?.map((s) => s.default_visualization)
              .flat()
              .map((indicator) => {
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
    [subtopicsData, setTopics],
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
                indicators: subtopicsData
                  ?.map((s) => s.default_visualization)
                  .flat()
                  .map((indicator) => ({
                    id: indicator?.id,
                    type: indicator?.type,
                    x: indicator?.x || 0,
                    y: indicator?.y || 0,
                    w: indicator?.w || DEFAULT_VISUALIZATION_SIZES[indicator?.type].w,
                    h: indicator?.h || DEFAULT_VISUALIZATION_SIZES[indicator?.type].h,
                  })),
              }
            : existingTopic,
        );
      });
    },
    [topic, subtopicsData, setTopics],
  );

  const selectedTopicIndicators = useMemo(
    () => topics?.find(({ id }) => id === topic.id)?.indicators,
    [topics, topic],
  );

  const defaultVisualizations = useMemo(
    () =>
      subtopicsData
        ?.map((s) => s.default_visualization)
        .flat()
        .filter((indicator): indicator is IndicatorView => Boolean(indicator)) ?? [],
    [subtopicsData],
  );

  const isTopicDefaultView = areArraysEqual(defaultVisualizations, selectedTopicIndicators);

  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);

  const handleClick = (open: boolean) => {
    setIndicatorsExpand((prev) => {
      if (open) {
        return {
          ...prev,
          [id]: [],
        };
      } else {
        return {
          ...prev,
          [id]: undefined,
        };
      }
    });
  };

  return (
    <li
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <Collapsible open={!!indicatorsExpand?.[id]} onOpenChange={handleClick}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
          )}
        >
          <div className={cn("flex items-center space-x-2.5")}>
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-cyan-100">
              <Image
                src={image}
                alt={`${name}`}
                priority
                fill
                sizes="100%"
                placeholder={PLACEHOLDER(80, 80)}
                className={cn({
                  "object-cover": true,
                })}
              />
            </div>
            <div className="flex flex-col items-start justify-start space-y-1">
              <span className="text-sm font-bold transition-none">{name}</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6">
          <SubtopicList topicId={id} />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );

  return (
    <li
      key={id}
      className={cn({
        "flex flex-col pr-0.5": true,
        "box-border border-b border-b-primary/20": open,
      })}
    >
      <Collapsible open={open}>
        <div
          className={cn({
            "flex h-10 items-center space-x-4 rounded-lg p-2 hover:bg-secondary": true,
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
                <span className="whitespace w-full flex-1 flex-nowrap text-sm">{topic.name}</span>
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
                        {t("reset")}
                      </Button>
                    </TooltipTrigger>

                    <TooltipPortal>
                      <TooltipContent side="top" align="end">
                        <div className="max-w-40">{t("reset-topics-info-tooltip")}</div>
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
          <SubtopicList topicId={topic.id} />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
