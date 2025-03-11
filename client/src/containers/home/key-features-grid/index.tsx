"use client";

import LazyLottieComponent from "lottie-react";

import CardsContainer from "@/containers/home/key-features-grid/cards-container";

import animation from "./grid-animation-lottie.json";

export default function KeyFeaturesGrid() {
  return (
    <section className="flex bg-blue-50 px-4">
      <div className="container flex flex-col items-center justify-center space-x-6 md:grid md:grid-cols-12">
        <div className="col-span-12 h-full max-w-lg items-center lg:col-span-6">
          <CardsContainer />
        </div>
        <div className="col-span-12 m-auto py-10 lg:col-span-6 lg:py-12 xl:py-56">
          <div className="m-auto h-80 w-80 sm:h-[600px] sm:w-[600px] xl:h-[650px] xl:w-[650px]">
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
