"use client";

import { useState } from "react";

import ReactMarkdown from "react-markdown";

import Image from "next/image";

import { useLocale, useTranslations } from "next-intl";
import { LuCirclePlay } from "react-icons/lu";
import { useInterval } from "usehooks-ts";

import { cn } from "@/lib/utils";

import { Media } from "@/containers/media";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Link } from "@/i18n/navigation";

const VIDEO_IDS: Record<string, string> = {
  es: "56ax7U-kFKg",
  en: "uCzzKJ5PNJs",
  pt: "Qp5jI-UqJ_4",
};

export default function Hero() {
  const [img, setImg] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);

  const t = useTranslations();
  const locale = useLocale();
  const videoId = VIDEO_IDS[locale] || VIDEO_IDS.en;

  useInterval(() => {
    setImg((prev) => (prev + 1) % 2);
  }, 4000);

  return (
    <section className="relative w-full overflow-hidden md:h-[calc(100svh-64px)] md:bg-blue-50">
      <div className="relative container grid h-full w-full grid-cols-12 items-center">
        <div className="md:animate-in md:fade-in-0 md:slide-in-from-left-40 relative z-10 col-span-12 flex flex-col space-y-6 py-8 md:col-span-5 md:duration-700">
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
            <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex space-x-2.5 px-8" variant="outline">
                  <LuCirclePlay className="h-5 w-5" />
                  <span>{t("landing-hero-buttons-more-info")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[min(75vw,calc(80vh*16/9))] gap-0 border-0 p-0">
                <DialogTitle className="sr-only">
                  {t("landing-hero-video-dialog-title")}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("landing-hero-buttons-more-info")}
                </DialogDescription>
                <div className="aspect-video max-h-[80vh] w-full">
                  {videoOpen && (
                    <iframe
                      className="h-full w-full rounded-lg"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                      title={t("landing-hero-video-dialog-title")}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                <DialogClose />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <Media greaterThanOrEqual="md">
        <div className="border-primary animate-in slide-in-from-bottom-40 slide-in-from-right-72 aspect-2880/1640 w-full overflow-hidden rounded-3xl border-16 shadow-2xl duration-700 md:absolute md:top-1/4 md:-right-1/4 md:w-375 md:max-w-3/4">
          <Image
            src="/images/home/hero1.webp"
            alt="Amazonia"
            width={2880}
            height={1640}
            className={cn({
              "absolute top-0 left-0 w-full object-cover opacity-0 transition-opacity duration-1000": true,
              "z-20 opacity-100": img === 0,
              "opacity-0 delay-500": img === 1,
            })}
            draggable={false}
            priority
          />
          <Image
            src="/images/home/hero2.webp"
            alt="Amazonia"
            width={2880}
            height={1640}
            className={cn({
              "absolute top-0 left-0 w-full object-cover opacity-0 transition-opacity duration-1000": true,
              "z-20 opacity-100": img === 1,
              "opacity-0 delay-500": img === 0,
            })}
            draggable={false}
            priority
          />
        </div>
      </Media>
      <Media lessThan="md">
        <div className="border-primary animate-in slide-in-from-bottom-40 mx-4 aspect-1440/820 overflow-hidden rounded-t-3xl border-8 border-b-0 shadow-2xl duration-700">
          <Image
            src="/images/home/hero-mobile.webp"
            alt="Amazonia"
            width={1440}
            height={820}
            className="w-full max-w-fit object-cover"
            draggable={false}
            priority
          />
        </div>
      </Media>
    </section>
  );
}
