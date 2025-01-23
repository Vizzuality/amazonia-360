"use client";

import { useEffect, useState } from "react";

import { useInView } from "react-intersection-observer";

import { LayoutDashboard, MapPinned, Share2 } from "lucide-react";

export default function CardsContainer() {
  const [cardInView, setCardInView] = useState(false);
  const [textInView, setTextInView] = useState(false);

  const { ref: textRef, inView: isTextInView } = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  const { ref: cardRef, inView: isCardInView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  useEffect(() => {
    if (isCardInView) setCardInView(true);
    if (isTextInView) setTextInView(true);
  }, [isCardInView, isTextInView]);

  return (
    <div className="flex h-full w-full flex-col py-10 md:py-28 lg:py-56">
      <div
        ref={textRef}
        className={` ${textInView ? "delay-0 md:animate-slide-down" : "opacity-0"}`}
      >
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          Key Features
        </h3>
        <h2 className="m-auto pb-6 text-2xl text-blue-400 lg:text-4xl">Generate quick reports</h2>
        <p className="text-base font-normal text-blue-900 lg:text-lg">
          Personalize your experience with reports that adapt to your focus areas, providing you
          with the targeted insights you need to make informed decisions.
        </p>
      </div>
      <ul
        ref={cardRef}
        className="mt-6 flex flex-col gap-2 md:mt-20 md:grid md:grid-cols-3 lg:mt-6"
      >
        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              cardInView ? "animate-left-to-right delay-0" : "opacity-0"
            }`}
          >
            <MapPinned size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Select area of interest</h4>
          </div>
        </li>
        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              cardInView ? "animate-left-to-right delay-300" : "opacity-0"
            }`}
          >
            <LayoutDashboard size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Define topics of interest</h4>
          </div>
        </li>

        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              cardInView ? "animate-left-to-right delay-500" : "opacity-0"
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
