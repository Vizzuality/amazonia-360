"use client";

import { useInView } from "react-intersection-observer";
import ReactMarkdown from "react-markdown";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { ReportIcon } from "@/components/ui/icons/report";
import { WandIcon } from "@/components/ui/icons/wand";

export default function CardsContainer() {
  const t = useTranslations();

  const { ref: cardRef, inView: isCardInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const { ref: textRef, inView: isTextInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <div className="flex h-full w-full flex-col justify-center gap-6 py-10 md:items-center md:py-28 lg:py-56">
      <div
        ref={textRef}
        className={cn({
          "md:opacity-0": !isTextInView,
          "md:animate-in md:fade-in-0 md:slide-in-from-top-10 md:delay-0 md:duration-700":
            isTextInView,
        })}
      >
        <h3 className="tracking-wide-lg text-sm font-extrabold text-blue-400 uppercase">
          {t("landing-key-features-note")}
        </h3>
        <h2 className="pb-6 text-2xl text-blue-600 lg:text-4xl">
          {t("landing-key-features-grid-title")}
        </h2>
        <div className="text-base font-normal text-blue-900 lg:text-lg">
          <ReactMarkdown>{t("landing-key-features-grid-description")}</ReactMarkdown>
        </div>
      </div>
      <ul ref={cardRef} className="flex w-full flex-col gap-2 md:grid md:grid-cols-12 lg:mt-6">
        <li className="col-span-4 flex w-full flex-1 justify-start md:justify-center">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-lg bg-white p-4 ${
              isCardInView
                ? "md:animate-in md:fade-in-0 md:slide-in-from-left-5 md:delay-0 md:duration-700"
                : "md:opacity-0"
            }`}
          >
            <HexagonIcon className="h-8 w-8 text-blue-400" />
            <h4 className="text-foreground font-semibold">
              {t("landing-key-features-grid-buttons-identify-hot-spots")}
            </h4>
          </div>
        </li>
        <li className="col-span-4 flex w-full flex-1 justify-start md:justify-center">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-lg bg-white p-4 ${
              isCardInView
                ? "md:animate-in md:fade-in-0 md:slide-in-from-left-5 md:delay-150 md:duration-700"
                : "md:opacity-0"
            }`}
          >
            <WandIcon className="text-blue-400" />
            <h4 className="text-foreground font-semibold">
              {t("landing-key-features-grid-buttons-redefine-your-area")}
            </h4>
          </div>
        </li>
        <li className="col-span-4 flex w-full flex-1 justify-start md:justify-center">
          <div
            className={`flex flex-1 flex-col items-start justify-start space-y-2 overflow-hidden rounded-lg bg-white p-4 ${
              isCardInView
                ? "md:animate-in md:fade-in-0 md:slide-in-from-left-5 md:delay-300 md:duration-700"
                : "md:opacity-0"
            }`}
          >
            <ReportIcon className="text-blue-400" />
            <h4 className="text-foreground font-semibold">
              {t("landing-key-features-grid-buttons-create-report")}
            </h4>
          </div>
        </li>
      </ul>
    </div>
  );
}
