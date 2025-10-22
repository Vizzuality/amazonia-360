"use client";

import { useRef } from "react";

import Image from "next/image";

import { PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Topic } from "@/constants/topics";

export default function TopicsItem({ id, name, image, description }: Topic) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div key={id} className="col-span-6 aspect-[4/3] xl:col-span-3 xl:aspect-square">
      <div className="group relative overflow-hidden shadow after:absolute after:bottom-0 after:left-0 after:h-16 after:w-full after:bg-gradient-to-b after:from-transparent after:to-[#09090B]/85 after:content-['']">
        <div className="relative aspect-[4/3] xl:aspect-square">
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
            "after:absolute after:left-0 after:top-0 after:h-full after:w-full after:bg-gradient-to-b after:from-gray-900/0 after:via-gray-900/50 after:to-gray-900/50",
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
              <p className="pt-2">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
