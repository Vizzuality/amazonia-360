"use client";

import { useRef } from "react";

import Image from "next/image";

import { LuCheck } from "react-icons/lu";

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
  label,
  image,
  size,
  interactive,
  description,
  checked,
  onChange,
}: TopicsItemProps) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div key={id} className="w-full">
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden mx-auto group cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-16 after:w-full after:bg-gradient-to-b after:from-transparent after:to-[#09090B]/85 after:content-['']",
          size === "sm" && "aspect-[206/107]",
          size === "lg" && "aspect-[210/300] 2xl:aspect-[210/380]",
          checked && "outline-dashed outline-primary outline-2",
        )}
        onClick={() => {
          if (onChange && interactive) onChange(!checked);
        }}
        onMouseEnter={() => {
          if (descriptionRef.current && size === "lg" && interactive) {
            descriptionRef.current.style.maxHeight = `${descriptionRef.current.scrollHeight}px`;
          }
        }}
        onMouseLeave={() => {
          if (descriptionRef.current && size === "lg" && interactive) {
            descriptionRef.current.style.maxHeight = "0";
          }
        }}
      >
        <Image
          src={image}
          alt={label}
          priority
          fill
          sizes="100%"
          className={cn({
            "object-cover": true,
            "group-hover:scale-105 transition-transform duration-300 ease-in-out transform-gpu":
              interactive,
          })}
        />

        {interactive && (
          <div
            className={cn({
              "flex justify-center items-center absolute top-2 right-2 w-8 h-8 border border-dashed border-white bg-white/20 rounded-full transition-colors":
                true,
              "bg-white/100": checked,
            })}
          >
            <LuCheck
              className={cn({
                "w-3 h-3 text-gray-900 transition-colors": true,
                "opacity-100": checked,
                "opacity-0": !checked,
              })}
            />
          </div>
        )}

        <div className="absolute z-10 bottom-0 left-0 p-4 bg-gradient-to-b from-gray-900/0 to-gray-900/85 w-full text-white">
          <h3 className="font-bold text-sm">{label}</h3>

          <div
            ref={descriptionRef}
            className={cn(
              "font-semibold text-xs max-h-0 overflow-hidden transition-all duration-300 ease-in-out",
            )}
          >
            <p className="pt-2">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
