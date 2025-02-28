"use client";

import { useCallback } from "react";

import { scroller } from "react-scroll";

import Image from "next/image";
import Link from "next/link";

import { Media } from "@/containers/media";

import { Button } from "@/components/ui/button";

export default function Hero() {
  const handleScroll = useCallback(() => {
    scroller.scrollTo("moreInfo", {
      duration: 1000,
      delay: 20,
      smooth: "easeInOutQuint",
    });
  }, []);

  return (
    <section className="relative w-full overflow-hidden md:h-[calc(100svh_-_64px)] md:bg-blue-50">
      <div className="container relative grid h-full w-full grid-cols-12 items-center">
        <div className="relative z-10 col-span-12 flex flex-col space-y-6 py-8 md:col-span-5 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-40">
          <h2 className="text-4xl font-bold text-blue-600 lg:text-5xl">
            Understanding
            <br /> Amazonia
            <br /> like never before
          </h2>
          <p className="text-base font-normal text-blue-900 lg:text-lg">
            With <span className="font-bold">AmazoniaForever360+</span>, unlock powerful insights
            about one of the planet&apos;s most vital ecosystem mosaics. Our intuitive platform
            transforms complex territorial data into actionable knowledge—no technical expertise
            needed. From biodiversity to infrastructure, explore and analyze to drive sustainable
            impact across Amazonia.
          </p>
          <div className="flex space-x-4 py-4 font-semibold md:py-6">
            <Link href="/report" prefetch>
              <Button size="lg" className="flex space-x-2.5 px-8">
                Access the tool
              </Button>
            </Link>
            <Button
              size="lg"
              className="flex space-x-2.5 px-8"
              variant="outline"
              onClick={handleScroll}
            >
              More info
            </Button>
          </div>
        </div>
      </div>
      <Media greaterThanOrEqual="md">
        <Image
          src="/images/home/hero.avif"
          alt="Amazonia"
          width={2500}
          height={2500}
          className="lg-top-[30%] w-full max-w-fit animate-half-right-bottom-to-left-top object-cover px-4 md:absolute md:right-[-25%] md:top-[25%] md:w-[1500px] md:max-w-[75%]"
          draggable={false}
        />
      </Media>
      <Media lessThan="md">
        <Image
          src="/images/home/hero-mobile.avif"
          alt="Amazonia"
          width={2500}
          height={2500}
          className="lg-top-[30%] w-full max-w-fit animate-half-right-bottom-to-left-top object-cover px-4 md:absolute md:right-[-25%] md:top-[25%] md:w-[1500px] md:max-w-[75%]"
          draggable={false}
        />
      </Media>
    </section>
  );
}
