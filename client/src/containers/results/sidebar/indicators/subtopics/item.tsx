"use client";

import { useAtom } from "jotai";
import { LuChevronDown } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { indicatorsExpandAtom } from "@/app/store";

import IndicatorsList from "@/containers/results/sidebar/indicators/list";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SubtopicsItem({ id, topic_id, name }: Subtopic) {
  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);

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
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <Collapsible open={!!indicatorsExpand?.[topic_id]?.includes(id)} onOpenChange={handleClick}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
          )}
        >
          <div className={cn("flex items-center space-x-2.5")}>
            <LuChevronDown
              className={cn("h-4 w-4", {
                "rotate-180": !!indicatorsExpand?.[topic_id]?.includes(id),
              })}
            />
            <div className="flex flex-col items-start justify-start space-y-1">
              <span className="text-left text-sm font-medium transition-none">{name}</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-2.5">
          <IndicatorsList topicId={topic_id} subtopicId={id} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
