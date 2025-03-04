"use client";

import { useInView } from "react-intersection-observer";

import { LayoutDashboard, MapPinned, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

export default function CardsContainer() {
  const { ref: textRef, inView: isTextInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const { ref: cardRef, inView: isCardInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <div className="flex h-full w-full flex-col py-10 md:py-28 lg:py-56">
      <div
        ref={textRef}
        className={cn({
          "opacity-0": !isTextInView,
          "md:delay-0 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-top-10":
            isTextInView,
        })}
      >
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          Key Features
        </h3>
        <h2 className="m-auto pb-6 text-2xl text-blue-400 lg:text-4xl">
          Generate Reports in Minutes
        </h2>
        <p className="text-base font-normal text-blue-900 lg:text-lg">
          Create customized reports focused on your areas of interest, with actionable insights and
          data visualizations generated instantly from our comprehensive territorial knowledge base.
        </p>
      </div>
      <ul
        ref={cardRef}
        className="mt-6 flex flex-col gap-2 sm:grid-cols-3 md:mt-20 md:grid lg:mt-6"
      >
        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              isCardInView
                ? "md:delay-0 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <MapPinned size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Select area of interest</h4>
          </div>
        </li>
        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              isCardInView
                ? "md:delay-150 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <LayoutDashboard size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Define topics of interest</h4>
          </div>
        </li>

        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              isCardInView
                ? "md:delay-300 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <Share2 size={32} strokeWidth={1} className="h-8 w-8 text-cyan-600" />
            <h4 className="font-bold text-blue-500">Share and download</h4>
          </div>
        </li>
      </ul>
    </div>
  );
}
