"use client";

import { useCallback } from "react";

import Image from "next/image";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { useAtom } from "jotai";
import { useLocale } from "next-intl";

import { PLACEHOLDER } from "@/lib/images";
import { useGetTopicsId } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { indicatorsExpandAtom, useSyncTopics } from "@/app/(frontend)/store";

import SubtopicList from "@/containers/results/sidebar/indicators/subtopics";

import { Switch } from "@/components/ui/switch";

import { CounterIndicatorsPill } from "./counter-indicators-pill";

export function TopicItem({ topic, id }: { topic: Topic; id: number }) {
  const { name, image } = topic;
  const locale = useLocale();

  const TOPIC = useGetTopicsId({ id, locale });

  const [topics, setTopics] = useSyncTopics();
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

  const handleChangeDefaultTopic = useCallback(
    (checked: boolean) => {
      setTopics((prev) => {
        const p = prev ?? [];

        const i = p.findIndex((topic) => topic.id === id);

        if (checked) {
          if (i < 0) {
            return [
              ...p,
              {
                id,
                indicators: TOPIC?.default_visualization,
              },
            ];
          }

          return p.map((topic) => {
            if (topic.id === id) {
              return {
                ...topic,
                indicators: TOPIC?.default_visualization,
              };
            }
            return topic;
          });
        }

        return p.filter((topic) => topic.id !== id);
      });
    },
    [id, setTopics, TOPIC?.default_visualization],
  );

  return (
    <li
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <Collapsible open={!!indicatorsExpand?.[id]} onOpenChange={handleClick}>
        <div
          className={cn(
            "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
          )}
        >
          <CollapsibleTrigger className="flex w-full cursor-pointer">
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

          <div className="flex items-center space-x-1">
            <CounterIndicatorsPill id={id} />

            <Switch
              className="h-4 w-8"
              checked={!!topics && topics.some((t) => t.id === id)}
              onCheckedChange={handleChangeDefaultTopic}
            />
          </div>
        </div>
        <CollapsibleContent className="pl-6">
          <SubtopicList topicId={id} />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
