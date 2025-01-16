"use client";

import { useCallback } from "react";

import { scroller } from "react-scroll";

import Image from "next/image";
import Link from "next/link";

import { LuArrowRight } from "react-icons/lu";

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
    <section className="relative flex w-full flex-col overflow-hidden md:h-[calc(100svh_-_theme(space.20)_+_1px)] md:flex-row md:bg-blue-50">
      <div className="relative px-4 md:container">
        <div className="relative z-10 flex max-w-2xl flex-col space-y-6 py-8 md:absolute md:top-[30%] md:animate-left-to-right md:rounded md:px-10 md:py-12">
          <h2 className="text-3xl font-bold text-blue-400 lg:text-4xl">
            Understanding Amazonia like never before
          </h2>
          <p className="text-base font-normal text-blue-900 lg:text-lg">
            With <span className="font-bold">AmazoniaForever360+</span> get all the resources you
            need about one of the world&apos;s most diverse ecosystems. AmazoniaForever360+ is your
            gateway to understanding and help you achieving the greatest impact in this region.
          </p>
          <div className="flex space-x-4 py-4 md:py-6">
            <Link href="/report" prefetch>
              <Button size="lg" className="flex space-x-2.5 px-8">
                <span className="font-semibold">Access report tool</span>
                <LuArrowRight size={20} strokeWidth={1} className="hidden md:block" />
              </Button>
            </Link>
            <Button
              size="lg"
              className="flex space-x-2.5 px-8"
              variant="outline"
              onClick={handleScroll}
            >
              <span className="font-semibold">More info</span>
              <LuArrowRight size={20} strokeWidth={1} className="hidden md:block" />
            </Button>
          </div>
        </div>
      </div>
      <Image
        src={"/images/home/hero.avif"}
        alt="Amazonia"
        width={1500}
        height={1500}
        className="w-full animate-half-right-bottom-to-left-top overflow-hidden md:absolute md:bottom-0 md:right-0 md:top-[30%] md:w-6/12 md:object-cover"
        draggable={false}
      />
    </section>
  );
}
