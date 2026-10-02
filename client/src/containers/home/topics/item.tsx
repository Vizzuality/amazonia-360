"use client";

import { useRef } from "react";

import Image from "next/image";

import { PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { Markdown } from "@/components/ui/markdown";

export default function TopicsItem({ id, name, image, description }: Topic) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div key={id} className="col-span-6 aspect-4/3 xl:col-span-3 xl:aspect-square">
      <div className="group relative overflow-hidden shadow-sm after:absolute after:bottom-0 after:left-0 after:h-16 after:w-full after:bg-linear-to-b after:from-transparent after:to-[#09090B]/85 after:content-['']">
        <div className="relative aspect-4/3 xl:aspect-square">
          <Image
            src={image}
            alt={`${name}`}
            priority
            fill
            sizes="100%"
            placeholder={PLACEHOLDER(210, 380)}
            className="object-cover"
            draggable={false}
            onMouseEnter={() => {
              if (descriptionRef.current) {
                descriptionRef.current.style.maxHeight = `${descriptionRef.current.scrollHeight}px`;
              }
            }}
            onMouseLeave={() => {
              if (descriptionRef.current) {
                descriptionRef.current.style.maxHeight = "0";
              }
            }}
          />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 z-10 w-full p-4 text-white",
            "after:absolute after:top-0 after:left-0 after:h-full after:w-full after:bg-linear-to-b after:from-gray-900/0 after:via-gray-900/50 after:to-gray-900/50",
          )}
        >
          <div className="relative z-10">
            <h3 className="text-sm font-bold">{name}</h3>

            <div
              ref={descriptionRef}
              className={cn(
                "max-h-0 overflow-hidden text-xs font-semibold transition-all duration-300 ease-in-out",
              )}
            >
              <Markdown className="prose-invert prose-headings:text-white prose-p:my-0 prose-a:text-white prose-strong:text-white max-w-none pt-2 text-xs font-semibold text-white">
                {description}
              </Markdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
