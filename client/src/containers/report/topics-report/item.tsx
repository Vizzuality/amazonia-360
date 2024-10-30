"use client";

import { useState, MouseEvent, useCallback } from "react";

import { LuChevronRight, LuGripVertical, LuPlus } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { TopicsParserType } from "@/app/parsers";
import { useSyncIndicators, useSyncTopics } from "@/app/store";

import { Topic } from "@/constants/topics";

import { VisualizationTypes } from "@/containers/report/visualization-types";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

import {
  Visualizations,
  VisualizationType,
} from "../visualization-types/types";

import { Badges } from "./badges";

export function TopicsReportItems({ topic, id }: { topic: Topic; id: string }) {
  const [topics, setTopics] = useSyncTopics();
  const [indicators] = useSyncIndicators();

  const selectedTopic = indicators?.find((topic) => topic.id === id);

  const [expandedTopics, setExpandedTopics] = useState<{
    [key: string]: boolean;
  }>({});

  const [expandedIndicators, setExpandedIndicators] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleExpandedTopics = (event: MouseEvent<{ value: string }>) => {
    const topicValue = event.currentTarget.value;
    if (topicValue) {
      setExpandedTopics((prevState) => ({
        ...prevState,
        [topicValue]: !prevState[topicValue],
      }));
    }
  };

  const toggleExpandedIndicators = (event: MouseEvent<{ value: string }>) => {
    const indicatorValue = event.currentTarget.value;

    if (indicatorValue) {
      setExpandedIndicators((prevState) => ({
        ...prevState,
        [indicatorValue]: !prevState[indicatorValue],
      }));
    }
  };

  const handleTopic = useCallback(
    (topicId: TopicsParserType, isChecked: boolean) => {
      setTopics((prevTopics) => {
        const newTopics = new Set(prevTopics);

        if (isChecked) {
          newTopics.add(topicId);
        } else {
          newTopics.delete(topicId);
        }

        return Array.from(newTopics);
      });
    },
    [setTopics],
  );

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
    <div key={id} className="flex flex-col">
      <div className="items-center flex text-sm justify-between">
        <div className="flex items-center space-x-1">
          <LuGripVertical />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            value={id}
            onClick={toggleExpandedTopics}
          >
            <LuChevronRight
              className={cn({
                "w-4 h-4 cursor-pointer": true,
                "rotate-90": expandedTopics[id],
              })}
            />
          </Button>

          <span>{topic.label}</span>
        </div>

        <Switch
          checked={topics?.includes(topic.id)}
          onCheckedChange={(e) => handleTopic(topic.id, e)}
          id={topic.id}
          value={topic.id}
        />
      </div>

      {expandedTopics[topic?.id] && ( // Check if this specific topic is expanded
        <ul className="py-2 pl-6 space-y-1 text-sm font-medium">
          {topic?.indicators?.map((indicator) => {
            const indicatorsDisplay = selectedTopic?.indicators.filter(
              ({ id }) => id === indicator.value,
            );

            return (
              <li key={indicator.value} className="flex flex-col ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {!!indicatorsDisplay?.length && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        value={indicator.value}
                        onClick={toggleExpandedIndicators}
                      >
                        <LuChevronRight
                          className={cn({
                            "w-4 h-4 cursor-pointer": true,
                            "rotate-90": expandedIndicators[indicator.value],
                          })}
                        />
                      </Button>
                    )}
                    <span>{indicator.label}</span>
                  </div>
                  <div></div>
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
                {expandedIndicators[indicator.value] && (
                  <Badges topicId={topic.id} indicatorId={indicator.value} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
