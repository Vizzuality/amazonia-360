"use client";

import { useCallback, useState } from "react";

import ReactMarkdown from "react-markdown";
import { scroller } from "react-scroll";

import Image from "next/image";

import { useTranslations } from "next-intl";
import { useInterval } from "usehooks-ts";

import { cn } from "@/lib/utils";

import { Media } from "@/containers/media";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function Hero() {
  const [img, setImg] = useState(0);
  const handleScroll = useCallback(() => {
    scroller.scrollTo("moreInfo", {
      duration: 1000,
      delay: 20,
      smooth: "easeInOutQuint",
    });
  }, []);

  const t = useTranslations();

  useInterval(() => {
    setImg((prev) => (prev + 1) % 2);
  }, 4000);

  return (
    <section className="relative w-full overflow-hidden md:h-[calc(100svh_-_64px)] md:bg-blue-50">
      <div className="container relative grid h-full w-full grid-cols-12 items-center">
        <div className="relative z-10 col-span-12 flex flex-col space-y-6 py-8 md:col-span-5 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-40">
          <h2 className="text-4xl text-blue-600 lg:text-4xl xl:text-5xl">
            <ReactMarkdown>{t("landing-hero-title")}</ReactMarkdown>
          </h2>
          <div className="text-base font-normal text-blue-900 lg:text-lg">
            <ReactMarkdown>{t("landing-hero-description")}</ReactMarkdown>
          </div>
          <div className="flex flex-col gap-2 py-4 font-semibold md:py-6 xl:flex-row">
            <Link href="/reports" prefetch>
              <Button size="lg" className="flex w-full space-x-2.5 px-8">
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
        <div className="aspect-[2286/1294] w-full overflow-hidden rounded-3xl border-8 border-primary shadow-2xl duration-700 animate-in slide-in-from-bottom-40 slide-in-from-right-72 md:absolute md:right-[-25%] md:top-[25%] md:w-[1500px] md:max-w-[75%]">
          <Image
            src="/images/home/hero1.webp"
            alt="Amazonia"
            width={2286}
            height={1294}
            className={cn({
              "absolute left-0 top-0 w-full object-cover opacity-0 transition-opacity duration-1000": true,
              "z-20 opacity-100": img === 0,
              "opacity-0 delay-500": img === 1,
            })}
            draggable={false}
            priority
          />
          <Image
            src="/images/home/hero2.webp"
            alt="Amazonia"
            width={2286}
            height={1294}
            className={cn({
              "absolute left-0 top-0 w-full object-cover opacity-0 transition-opacity duration-1000": true,
              "z-20 opacity-100": img === 1,
              "opacity-0 delay-500": img === 0,
            })}
            draggable={false}
            priority
          />
        </div>
      </Media>
      <Media lessThan="md">
        <div className="mx-4 aspect-[1143/647] overflow-hidden rounded-t-3xl border-8 border-b-0 border-primary shadow-2xl duration-700 animate-in slide-in-from-bottom-40">
          <Image
            src="/images/home/hero-mobile.webp"
            alt="Amazonia"
            width={1143}
            height={647}
            className="w-full max-w-fit object-cover"
            draggable={false}
            priority
          />
        </div>
      </Media>
    </section>
  );
}
