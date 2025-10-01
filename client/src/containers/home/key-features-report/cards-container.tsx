"use client";

import { useInView } from "react-intersection-observer";

import { useTranslations } from "next-intl";
import { LuLayoutDashboard, LuMapPinned, LuShare2 } from "react-icons/lu";

import { cn } from "@/lib/utils";

export default function CardsContainer() {
  const t = useTranslations();

  const { ref: textRef, inView: isTextInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const { ref: cardRef, inView: isCardInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <div className="flex h-full w-full flex-col py-10 md:py-28 lg:py-56">
      <div
        ref={textRef}
        className={cn({
          "opacity-0": !isTextInView,
          "md:delay-0 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-top-10":
            isTextInView,
        })}
      >
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          {t("landing-key-features-note")}
        </h3>
        <h2 className="m-auto pb-6 text-2xl text-blue-400 lg:text-4xl">
          {t("landing-key-features-report-title")}
        </h2>
        <p className="text-base font-normal text-blue-900 lg:text-lg">
          {t("landing-key-features-report-description")}
        </p>
      </div>
      <ul ref={cardRef} className="mt-6 flex flex-col gap-2 sm:grid-cols-3 md:grid lg:mt-6">
        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-lg bg-blue-50 p-4 ${
              isCardInView
                ? "md:delay-0 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <LuMapPinned size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-semibold text-foreground">
              {t("landing-key-features-report-buttons-select-area-of-interest")}
            </h4>
          </div>
        </li>
        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-lg bg-blue-50 p-4 ${
              isCardInView
                ? "md:delay-150 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <LuLayoutDashboard size={32} strokeWidth={1} className="text-cyan-600" />
            <h4 className="font-semibold text-foreground">
              {t("landing-key-features-report-buttons-define-topics-of-interest")}
            </h4>
          </div>
        </li>

        <li className="flex w-full">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-lg bg-blue-50 p-4 ${
              isCardInView
                ? "md:delay-300 md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-5"
                : "opacity-0"
            }`}
          >
            <LuShare2 size={32} strokeWidth={1} className="h-8 w-8 text-cyan-600" />
            <h4 className="font-semibold text-foreground">
              {t("landing-key-features-report-buttons-share-and-download")}
            </h4>
          </div>
        </li>
      </ul>
    </div>
  );
}
