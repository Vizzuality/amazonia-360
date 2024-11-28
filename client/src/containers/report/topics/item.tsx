"use client";

import { useRef } from "react";

import Image from "next/image";

import { LuCheck } from "react-icons/lu";

import { PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Topic } from "@/constants/topics";

type TopicsItemProps = Topic & {
  size: "sm" | "md" | "lg";
  checked: boolean;
  interactive: boolean;
  onChange: (checked: boolean) => void;
};

export default function TopicsItem({
  id,
  name,
  image,
  size,
  interactive,
  description,
  checked,
  onChange,
}: TopicsItemProps) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div key={id} className="w-full max-w-52">
      <div
        className={cn(
          "group relative mx-auto cursor-pointer overflow-hidden rounded-2xl shadow after:absolute after:bottom-0 after:left-0 after:h-16 after:w-full after:bg-gradient-to-b after:from-transparent after:to-[#09090B]/85 after:content-['']",
          size === "sm" && "aspect-[206/107]",
          size === "lg" &&
            "aspect-[210/250] sm:aspect-[600/200] lg:aspect-[210/250] tall:2xl:aspect-[210/380]",
          checked && "outline-dashed outline-2 outline-primary",
          !interactive && "cursor-auto",
        )}
        onClick={() => {
          if (onChange && interactive) onChange(!checked);
        }}
        onMouseEnter={() => {
          if (interactive && descriptionRef.current && size === "lg") {
            descriptionRef.current.style.maxHeight = `${descriptionRef.current.scrollHeight}px`;
          }
        }}
        onMouseLeave={() => {
          if (interactive && descriptionRef.current && size === "lg") {
            descriptionRef.current.style.maxHeight = "0";
          }
        }}
      >
        <Image
          src={image}
          alt={name}
          priority
          fill
          sizes="100%"
          placeholder={size === "lg" ? PLACEHOLDER(210, 380) : PLACEHOLDER(210, 250)}
          className={cn({
            "object-cover": true,
            "transform-gpu transition-transform duration-300 ease-in-out group-hover:scale-105":
              interactive,
          })}
        />

        {interactive && (
          <div
            className={cn({
              "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-white bg-white/20 transition-colors":
                true,
              "bg-white/100": checked,
            })}
          >
            <LuCheck
              className={cn({
                "h-3 w-3 text-gray-900 transition-colors": true,
                "opacity-100": checked,
                "opacity-0": !checked,
              })}
            />
          </div>
        )}

        <div
          className={cn(
            "absolute bottom-0 left-0 z-10 w-full p-4 text-white",
            "after:absolute after:left-0 after:top-0 after:h-full after:w-full after:bg-gradient-to-b after:from-gray-900/0 after:via-gray-900/50 after:to-gray-900/50",
          )}
        >
          <div className="relative z-10">
            <h3 className="text-sm font-bold">{name}</h3>

            <div
              ref={descriptionRef}
              className={cn(
                "max-h-0 overflow-hidden text-xs font-semibold transition-all duration-300 ease-in-out",
                !interactive && "max-h-none lg:max-h-0 xl:max-h-none",
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
