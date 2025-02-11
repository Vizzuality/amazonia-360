"use client";

import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { ReportIcon } from "@/components/ui/icons/report";
import { WandIcon } from "@/components/ui/icons/wand";

export default function CardsContainer() {
  const { ref: cardRef, inView: isCardInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const { ref: textRef, inView: isTextInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 py-10 md:py-28 lg:py-56">
      <div
        ref={textRef}
        className={cn({
          "opacity-0": !isTextInView,
          "delay-0 duration-700 animate-in fade-in-0 slide-in-from-top-10": isTextInView,
        })}
      >
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          Key Features
        </h3>
        <h2 className="pb-6 text-2xl text-blue-400 md:text-4xl">
          The power of
          <br /> Amazonia Grid
        </h2>
        <p className="text-base font-normal text-blue-900 lg:text-lg">
          Whether you&apos;re focusing on population, biodiversity, or other key metrics, this tool
          lets you filter and select only the regions that meet your chosen criteria.
        </p>
      </div>
      <ul
        ref={cardRef}
        className="mt-6 flex w-full flex-col gap-2 md:mt-20 md:grid md:grid-cols-3 lg:mt-6"
      >
        <li className="flex w-full flex-1 justify-start md:justify-center">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-white p-4 ${
              isCardInView
                ? "delay-0 duration-700 animate-in fade-in-0 slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <HexagonIcon className="h-8 w-8 text-cyan-600" />
            <h4 className="font-bold text-blue-500">Identify hotspots</h4>
          </div>
        </li>
        <li className="flex w-full flex-1 justify-start md:justify-center">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-white p-4 ${
              isCardInView
                ? "delay-300 duration-700 animate-in fade-in-0 slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <WandIcon className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Redefine your area</h4>
          </div>
        </li>
        <li className="flex w-full flex-1 justify-start md:justify-center">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-white p-4 ${
              isCardInView
                ? "delay-500 duration-700 animate-in fade-in-0 slide-in-from-left-5"
                : "opacity-0"
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
