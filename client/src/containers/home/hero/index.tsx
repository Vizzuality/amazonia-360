"use client";

import { useCallback } from "react";

import ReactMarkdown from "react-markdown";
import { scroller } from "react-scroll";

import Image from "next/image";
import Link from "next/link";

import { useTranslations } from "next-intl";

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

  const t = useTranslations();

  return (
    <section className="relative w-full overflow-hidden md:h-[calc(100svh_-_64px)] md:bg-blue-50">
      <div className="container relative grid h-full w-full grid-cols-12 items-center">
        <div className="relative z-10 col-span-12 flex flex-col space-y-6 py-8 md:col-span-5 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-40">
          <h2 className="text-4xl text-blue-600 lg:text-5xl">
            <ReactMarkdown>{t("landing-hero-title")}</ReactMarkdown>
          </h2>
          <div className="text-base font-normal text-blue-900 lg:text-lg">
            <ReactMarkdown>{t("landing-hero-description")}</ReactMarkdown>
          </div>
          <div className="flex space-x-4 py-4 font-semibold md:py-6">
            <Link href="/report" prefetch>
              <Button size="lg" className="flex space-x-2.5 px-8">
                {t("landing-hero-buttons-access-the-tool")}
              </Button>
            </Link>
            <Button
              size="lg"
              className="flex space-x-2.5 px-8 capitalize"
              variant="outline"
              onClick={handleScroll}
            >
              {t("landing-hero-buttons-more-info")}
            </Button>
          </div>
        </div>
      </div>
      <Media greaterThanOrEqual="md">
        <Image
          src="/images/home/hero2.avif"
          alt="Amazonia"
          width={2500}
          height={2500}
          className="lg-top-[30%] w-full max-w-fit object-cover px-4 duration-700 animate-in slide-in-from-bottom-40 slide-in-from-right-72 md:absolute md:right-[-25%] md:top-[25%] md:w-[1500px] md:max-w-[75%]"
          draggable={false}
          priority
        />
      </Media>
      <Media lessThan="md">
        <Image
          src="/images/home/hero-mobile.avif"
          alt="Amazonia"
          width={2500}
          height={2500}
          className="lg-top-[30%] w-full max-w-fit object-cover px-4 duration-700 animate-in slide-in-from-bottom-40 slide-in-from-right-72 md:absolute md:right-[-25%] md:top-[25%] md:w-[1500px] md:max-w-[75%]"
          draggable={false}
          priority
        />
      </Media>
    </section>
  );
}
