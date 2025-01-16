"use client";

import { useEffect, useState } from "react";

import { useInView } from "react-intersection-observer";

import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { ReportIcon } from "@/components/ui/icons/report";
import { WandIcon } from "@/components/ui/icons/wand";

export default function CardsContainer() {
  const [cardInView, setCardInView] = useState(false);
  const [textInView, setTextInView] = useState(false);

  const { ref: cardRef, inView: isCardInView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const { ref: textRef, inView: isTextInView } = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  useEffect(() => {
    if (isCardInView) setCardInView(true);
    if (isTextInView) setTextInView(true);
  }, [isCardInView, isTextInView]);

  return (
    <div className="flex h-full w-full flex-col items-center py-10 align-middle md:py-28 lg:py-56">
      <div ref={textRef} className={` ${textInView ? "animate-slide-down delay-0" : "opacity-0"}`}>
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          key features
        </h3>
        <h2 className="pb-6 text-2xl text-blue-400 md:text-4xl">The power of Amazonia Grid</h2>
        <p className="text-base font-normal text-blue-900 lg:text-lg">
          Whether you&apos;re focusing on population, biodiversity, or other key metrics, this tool
          lets you filter and select only the regions that meet your chosen criteria.
        </p>
      </div>
      <ul ref={cardRef} className="mt-20 grid grid-cols-3 gap-2 lg:mt-6">
        <li className="flex">
          <div
            className={`flex flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-white p-4 ${
              cardInView ? "animate-left-to-right delay-0" : "opacity-0"
            }`}
          >
            <HexagonIcon className="h-8 w-8 text-cyan-600" />
            <h4 className="font-bold text-blue-500">Identify hotspots</h4>
          </div>
        </li>
        <li className="flex">
          <div
            className={`flex flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-white p-4 ${
              cardInView ? "animate-left-to-right delay-300" : "opacity-0"
            }`}
          >
            <WandIcon className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Redefine your area </h4>
          </div>
        </li>
        <li className="flex">
          <div
            className={`flex flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-white p-4 ${
              cardInView ? "animate-left-to-right delay-500" : "opacity-0"
            }`}
          >
            <ReportIcon className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Create report</h4>
          </div>
        </li>
      </ul>
    </div>
  );
}
