"use client";

import { useState } from "react";

import Image from "next/image";

import { useInterval } from "usehooks-ts";

import { cn } from "@/lib/utils";

import CardsContainer from "@/containers/home/key-features-grid/cards-container";

export default function KeyFeaturesGrid() {
  const [img, setImg] = useState(0);

  useInterval(() => {
    setImg((prev) => (prev + 1) % 2);
  }, 4000);

  return (
    <section className="flex bg-blue-50">
      <div className="container flex flex-col items-center justify-center md:grid md:grid-cols-12 md:space-x-6">
        <div className="col-span-12 h-full max-w-lg items-center lg:col-span-6">
          <CardsContainer />
        </div>
        <div className="col-span-12 m-auto py-10 lg:col-span-6 lg:py-12 xl:py-56">
          <div className="relative m-auto h-80 w-80 sm:h-150 sm:w-112.5 xl:h-162.5 xl:w-162.5">
            <Image
              src="/images/home/grid_1.avif"
              alt="Grid Animation"
              fill
              className={cn({
                "h-full w-full object-contain p-4 opacity-0 transition-opacity duration-1000": true,
                "z-20 opacity-100": img === 0,
                "opacity-0 delay-500": img === 1,
              })}
            />
            <Image
              src="/images/home/grid_2.avif"
              alt="Grid Animation"
              fill
              className={cn({
                "h-full w-full object-contain p-4 opacity-0 transition-opacity duration-1000": true,
                "z-20 opacity-100": img === 1,
                "opacity-0 delay-500": img === 0,
              })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
