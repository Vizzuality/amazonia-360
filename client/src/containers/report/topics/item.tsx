"use client";

import { useRef } from "react";

import Image from "next/image";

import { LuCheck } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Topic } from "@/constants/topics";

type TopicsItemProps = Topic & {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function TopicsItem({
  id,
  label,
  image,
  description,
  checked,
  onChange,
}: TopicsItemProps) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div key={id} className="col-span-6 md:col-span-4 lg:col-span-2">
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden mx-auto aspect-[210/300] 2xl:aspect-[210/380] group cursor-pointer",
          checked && "outline-dashed outline-primary outline-2",
        )}
        onClick={() => {
          if (onChange) onChange(!checked);
        }}
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
      >
        <Image
          src={image}
          alt={label}
          priority
          fill
          sizes="100%"
          className="group-hover:scale-105 transition-transform duration-300 ease-in-out transform-gpu object-cover"
        />

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

        <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-b from-gray-900/0 to-gray-900/85 w-full text-white">
          <h3 className="font-bold text-sm">{label}</h3>

          <div
            ref={descriptionRef}
            className="font-semibold text-xs max-h-0 overflow-hidden transition-all group-hover:max-h-20 duration-300 ease-in-out"
          >
            <p className="pt-2">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
