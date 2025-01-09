"use client";

import CardsContainer from "@/containers/home/key-features-grid/cards-container";

import { LazyLottie } from "@/components/lottie";

export default function KeyFeaturesGrid() {
  return (
    <section className="flex bg-blue-50">
      <div className="container flex justify-between py-10 md:py-28 lg:gap-80">
        <div className="max-w-lg">
          <CardsContainer />
        </div>

        <LazyLottie
          id="grid-animation"
          getAnimationData={() => import("./grid-animation-lottie.json")}
          loop={true}
          autoplay={true}
          className="h-[600px] w-[600px] md:w-[800px] lg:w-[1000px] xl:w-[1200px]"
        />
      </div>
    </section>
  );
}
