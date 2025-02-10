"use client";

import { useInView } from "react-intersection-observer";

import { Media } from "@/containers/media";

import CardsContainer from "./cards-container";
import KeyFeaturesChartsColumn1 from "./charts-column-1";
import KeyFeaturesChartsColumn1Mobile from "./charts-column-1-mobile";
import KeyFeaturesChartsColumn2 from "./charts-column-2";
import KeyFeaturesChartsColumn2Mobile from "./charts-column-2-mobile";

export default function KeyFeatures() {
  const [refCol, inViewCol] = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  return (
    <section className="container relative grid w-full grid-cols-12 overflow-hidden md:container md:max-h-[720px]">
      {/* Left Section */}
      <div className="order-2 col-span-12 md:order-1 md:col-span-5">
        <CardsContainer />
      </div>

      {/* Right Section */}
      <div
        ref={refCol}
        className="relative order-1 col-span-12 md:order-2 md:col-span-6 md:col-start-7"
      >
        {/* Gradients */}
        <Media greaterThanOrEqual="md">
          <>
            <div className="pointer-events-none top-0 z-10 h-36 bg-gradient-to-b from-white to-transparent md:absolute md:left-0 md:right-0" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-36 bg-gradient-to-t from-white to-transparent" />
          </>
        </Media>

        <Media lessThan="md">
          <>
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-5 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-5 bg-gradient-to-l from-white to-transparent" />
          </>
        </Media>

        {/* Charts */}
        <div className="relative flex w-full flex-col items-center justify-end md:h-full md:flex-row md:items-center md:gap-4">
          <div className="relative flex flex-row justify-center md:flex-col">
            <Media greaterThanOrEqual="md">
              <KeyFeaturesChartsColumn1 inView={inViewCol} />
            </Media>

            <Media lessThan="md">
              <KeyFeaturesChartsColumn1Mobile inView={true} />
            </Media>
          </div>

          <div className="relative mt-4 flex flex-col justify-center md:mt-0 md:translate-y-[20px]">
            <Media greaterThanOrEqual="md">
              <KeyFeaturesChartsColumn2 inView={inViewCol} />
            </Media>

            <Media lessThan="md">
              <KeyFeaturesChartsColumn2Mobile inView={true} />
            </Media>
          </div>
        </div>
      </div>
    </section>
  );
}
