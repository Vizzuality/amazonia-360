"use client";

import Image from "next/image";

import { PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Topic } from "@/constants/topics";

type TopicsItemProps = Topic & {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function TopicsItem({
  id,
  name,
  image,
  description,
  checked,
  onChange,
}: TopicsItemProps) {
  return (
    <button
      key={id}
      className={cn(
        "h-full w-full grow overflow-hidden rounded-lg border border-border bg-white p-1 text-left transition-all duration-500",
        checked && "border-cyan-500 bg-blue-50",
      )}
      onClick={() => onChange(!checked)}
    >
      <div className={cn("flex items-center space-x-2.5 transition-transform duration-300")}>
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-cyan-100">
          <Image
            src={image}
            alt={name}
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
          <span className="text-xs font-medium text-muted-foreground">{description}</span>
        </div>
      </div>
    </button>
  );
}
