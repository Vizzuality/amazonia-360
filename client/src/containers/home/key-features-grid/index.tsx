"use client";

import LazyLottieComponent from "lottie-react";

import CardsContainer from "@/containers/home/key-features-grid/cards-container";

import animation from "./grid-animation-lottie.json";

export default function KeyFeaturesGrid() {
  return (
    <section className="flex bg-blue-50 px-4">
      <div className="container flex flex-col-reverse items-center justify-center space-x-6 sm:justify-between md:flex-row">
        <div className="h-full max-w-lg items-center">
          <CardsContainer />
        </div>
        <div className="m-auto py-10 md:py-28 lg:py-56">
          <div className="h-80 w-80 sm:h-[400px] sm:w-[400px] md:h-[450px] md:w-[450px] lg:h-[600px] lg:w-[600px] xl:h-[650px] xl:w-[650px]">
            <LazyLottieComponent
              id="grid-animation"
              animationData={animation}
              loop={true}
              autoplay={true}
              width="100%"
              height="100%"
              className="h-full w-full object-contain p-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
