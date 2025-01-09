"use client";

import { useEffect, useState } from "react";

import { useInView } from "react-intersection-observer";

import { LayoutDashboard, MapPinned, Share2 } from "lucide-react";

export default function CardsContainer() {
  const [cardInView, setCardInView] = useState(false);

  const { ref: cardRef, inView: isCardInView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  useEffect(() => {
    if (isCardInView) setCardInView(true);
  }, [isCardInView]);

  return (
    <div className="flex h-full w-full flex-col py-10 md:py-28 lg:py-56">
      <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
        Key Features
      </h3>
      <h2 className="pb-6 text-2xl text-blue-400 lg:text-4xl">Generate quick reports</h2>
      <p className="text-base font-normal text-blue-900 lg:text-lg">
        Personalize your experience with reports that adapt to your focus areas, providing you with
        the targeted insights you need to make informed decisions.
      </p>
      <ul ref={cardRef} className="mt-20 grid grid-cols-3 gap-2 lg:mt-6">
        <li className="flex">
          <div
            className={`flex flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              cardInView ? "animate-growWidth delay-0" : "opacity-0"
            }`}
          >
            <MapPinned size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Select area of interest</h4>
          </div>
        </li>
        <li className="flex">
          <div
            className={`flex flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              cardInView ? "animate-growWidth delay-500" : "opacity-0"
            }`}
          >
            <LayoutDashboard size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-bold text-blue-500">Define topics of interest</h4>
          </div>
        </li>
        <li className="flex">
          <div
            className={`flex flex-col items-start justify-start space-y-2 overflow-hidden rounded-sm bg-blue-50 p-4 ${
              cardInView ? "animate-growWidth delay-1000" : "opacity-0"
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
