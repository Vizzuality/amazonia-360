"use client";

import { useRef } from "react";

import Image from "next/image";

import { PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Topic } from "@/constants/topics";

export default function TopicsItem({ id, name_en, image, description_en }: Topic) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div key={id} className="h-20 w-screen md:h-96 md:w-64 lg:w-96">
      <div className="group relative cursor-pointer overflow-hidden shadow after:absolute after:bottom-0 after:left-0 after:h-16 after:w-full after:bg-gradient-to-b after:from-transparent after:to-[#09090B]/85 after:content-['']">
        <div className="h-20 w-screen md:h-96 md:w-96">
          <Image
            src={image}
            alt={`${name_en}`}
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
            "absolute bottom-0 left-0 z-10 w-full p-4 text-white",
            "after:absolute after:left-0 after:top-0 after:h-full after:w-full after:bg-gradient-to-b after:from-gray-900/0 after:via-gray-900/50 after:to-gray-900/50",
          )}
        >
          <div className="relative z-10">
            <h3 className="text-sm font-bold">{name_en}</h3>

            <div
              ref={descriptionRef}
              className={cn(
                "max-h-0 overflow-hidden text-xs font-semibold transition-all duration-300 ease-in-out",
              )}
            >
              <p className="pt-2">{description_en}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
