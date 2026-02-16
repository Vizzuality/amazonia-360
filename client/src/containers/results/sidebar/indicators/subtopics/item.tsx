"use client";

import { useAtom } from "jotai";
import { LuChevronRight } from "react-icons/lu";

import { useScrollOnExpand } from "@/lib/hooks";
import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { indicatorsExpandAtom } from "@/app/(frontend)/store";

import IndicatorsList from "@/containers/results/sidebar/indicators/list";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { CounterIndicatorsPill } from "./counter-indicators-pill";

export default function SubtopicsItem({ id, topic_id, name }: Subtopic) {
  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);
  const scrollRef = useScrollOnExpand(!!indicatorsExpand?.[topic_id]?.includes(id));

  const handleClick = (open: boolean) => {
    setIndicatorsExpand((prev) => {
      if (open) {
        return {
          ...prev,
          [topic_id]: [...(prev?.[topic_id] || []), id],
        };
      } else {
        return {
          ...prev,
          [topic_id]: (prev?.[topic_id] || []).filter((subtopicId) => subtopicId !== id),
        };
      }
    });
  };

  return (
    <div
      ref={scrollRef as React.RefObject<HTMLDivElement | null>}
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <Collapsible open={!!indicatorsExpand?.[topic_id]?.includes(id)} onOpenChange={handleClick}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between gap-2 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
          )}
        >
          <div className={cn("flex items-center space-x-2.5")}>
            <LuChevronRight
              className={cn("h-4 w-4 transition-transform duration-300", {
                "rotate-90": !!indicatorsExpand?.[topic_id]?.includes(id),
              })}
            />
            <div className="flex flex-col items-start justify-start space-y-1">
              <span className="text-left text-sm font-medium transition-none">{name}</span>
            </div>
          </div>
          <CounterIndicatorsPill id={id} topic_id={topic_id} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-2.5">
          <IndicatorsList topicId={topic_id} subtopicId={id} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
