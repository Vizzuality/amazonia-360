"use client";

import Image from "next/image";

import { PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Topic } from "@/constants/topics";

import { Checkbox } from "@/components/ui/checkbox";

type TopicsItemProps = Topic & {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function TopicsItem({ id, name, image, checked, onChange }: TopicsItemProps) {
  return (
    <div
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white p-1 pr-2 text-left transition-all duration-300 ease-in-out hover:bg-blue-50",
      )}
      onClick={() => onChange(!checked)}
    >
      <div
        className={cn(
          "flex items-center justify-between space-x-2.5 transition-transform duration-300",
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
      </div>
    </div>
  );
}
