"use client";

import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { Checkbox } from "@/components/ui/checkbox";

export default function SubtopicsItem({ id, name }: Subtopic) {
  return (
    <div
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
        )}
      >
        <div className={cn("flex items-center space-x-2.5")}>
          <div className="flex flex-col items-start justify-start space-y-1">
            <span className="text-sm font-medium transition-none">{name}</span>
          </div>
        </div>
        <div>
          <Checkbox className="block" />
        </div>
      </div>
    </div>
  );
}
