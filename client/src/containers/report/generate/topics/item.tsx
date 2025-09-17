"use client";

import Image from "next/image";

import { PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Topic } from "@/constants/topics";

import SubtopicList from "@/containers/report/generate/subtopics";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type TopicsItemProps = Topic & {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function TopicsItem({ id, name, image, checked }: TopicsItemProps) {
  return (
    <Collapsible>
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
            <span className="text-base font-bold transition-none">{name}</span>
          </div>
        </div>
        <div>
          <Checkbox className="block" checked={checked} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="pl-6">
        <SubtopicList topicId={id} />
      </CollapsibleContent>
    </Collapsible>
  );
}
