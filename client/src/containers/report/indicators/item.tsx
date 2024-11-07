"use client";

import { useState, useCallback } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { LuChevronRight, LuGripVertical } from "react-icons/lu";

import { useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, Topic } from "@/constants/topics";

import { Switch } from "@/components/ui/switch";

import { VisualizationType } from "../visualization-types/types";

import { TopicsReportItem } from "./sidebar-topic-item";

export function TopicsReportItems({ topic, id }: { topic: Topic; id: string }) {
  const [topics, setTopics] = useSyncTopics();
  const [open, setOpen] = useState(false);

  const handleTopic = useCallback(
    (topic: Topic, isChecked: boolean) => {
      setTopics((prevTopics) => {
        if (isChecked) {
          const newTopic = {
            id: topic.id,
            indicators:
              topic.default_indicators
                ?.map((indicatorValue) => {
                  const indicator = topic?.indicators?.find((ind) => ind.value === indicatorValue);
                  return {
                    id: indicator?.value || "",
                    type: indicator?.types_available?.[0] as VisualizationType,
                    size: DEFAULT_VISUALIZATION_SIZES[indicator?.types_available?.[0] || "map"],
                  };
                })
                .filter((ind) => ind.id) || [],
          };
          return [...(prevTopics?.filter((t) => t.id !== topic.id) || []), newTopic];
        } else {
          return prevTopics?.filter((t) => t.id !== topic.id) || [];
        }
      });
    },
    [setTopics],
  );

  return (
    <div key={id} className="flex flex-col">
      <Collapsible open={open}>
        <div className="flex">
          <CollapsibleTrigger
            className="flex w-full min-w-28 items-center justify-between text-sm"
            asChild
            onClick={(event) => {
              event.stopPropagation();
              setOpen(!open);
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <LuGripVertical />
                <LuChevronRight
                  className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                />

                <span>{topic.label}</span>
              </div>
            </div>
          </CollapsibleTrigger>
          <Switch
            checked={!!topics?.find((t) => t.id === topic.id)}
            onCheckedChange={(e) => handleTopic(topic, e)}
            id={topic.id}
            value={topic.id}
          />
        </div>
        <CollapsibleContent className="pt-2">
          <ul className="space-y-1 py-2 pl-6 text-sm font-medium">
            {topic?.indicators?.map((indicator) => (
              <li key={`${indicator.value}-${topic.id}`}>
                <TopicsReportItem {...{ topic, indicator }} />
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
