"use client";

import { useInView } from "react-intersection-observer";

import CardsContainer from "./cards-container";
import KeyFeaturesChartsColumn1 from "./charts-column-1";
import KeyFeaturesChartsColumn2 from "./charts-column-2";

export default function KeyFeatures() {
  const [refCol, inViewCol] = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  return (
    <section className="flex h-fit w-full flex-col-reverse justify-between px-4 md:container md:flex-row md:px-0">
      <div className="w-full max-w-lg">
        <CardsContainer />
      </div>
      <div
        ref={refCol}
        className="relative m-auto h-full w-full flex-col justify-center gap-4 space-y-10 py-10 md:flex md:flex-row md:items-center md:justify-end md:py-28 lg:py-56"
      >
        <div className="pointer-events-none absolute left-0 top-0 z-50 w-36 bg-gradient-to-b from-white to-transparent md:right-0 md:h-36 md:w-full" />

        <KeyFeaturesChartsColumn1 inView={inViewCol} />

        <KeyFeaturesChartsColumn2 inView={inViewCol} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-36 bg-gradient-to-t from-white to-transparent" />
      </div>
    </section>
  );
}
