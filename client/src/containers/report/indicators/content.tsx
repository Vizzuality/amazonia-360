"use client";

import { useEffect, useRef } from "react";

import { useSearchParams } from "next/navigation";

import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { usePreviousDifferent } from "@/lib/hooks";
import { useGetDefaultIndicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { indicatorsExpandAtom, useSyncIndicators } from "@/app/(frontend)/store";

import IndicatorsFooter from "@/containers/report/indicators/footer";
import IndicatorsSearch from "@/containers/report/indicators/search";
import IndicatorsTopicsList from "@/containers/report/indicators/topics";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Link } from "@/i18n/navigation";

export default function ReportIndicatorsContent() {
  const locale = useLocale();
  const t = useTranslations();

  const [indicators] = useSyncIndicators();
  const previousIndicators = usePreviousDifferent(indicators);

  const { data: indicatorsData } = useGetDefaultIndicators({ locale });

  const searchParams = useSearchParams();

  const scrollRef = useRef<HTMLDivElement>(null);

  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);

  useEffect(() => {
    const i = indicators ?? [];
    const p = previousIndicators ?? [];
    if (i && p && i.length > p.length) {
      // Get the difference between the two arrays
      const addedIndicatorsIds = i.filter((x) => !p.includes(x));
      const addedIndicators = indicatorsData?.filter((indicator) =>
        addedIndicatorsIds.includes(indicator.id),
      );

      if (addedIndicators && !!addedIndicators.length) {
        // Expand the topics and subtopics of the added indicators
        setIndicatorsExpand((prev) => {
          const newExpand = { ...prev };

          addedIndicators.forEach((indicator) => {
            if (!newExpand[indicator.topic.id] || !newExpand[indicator.topic.id]?.length) {
              newExpand[indicator.topic.id] = [
                ...(indicator.subtopic.id ? [indicator.subtopic.id] : []),
              ];
            }
            if (!newExpand[indicator.topic.id]?.includes(indicator.subtopic.id)) {
              newExpand[indicator.topic.id]?.push(indicator.subtopic.id);
            }
          });
          return newExpand;
        });
      }
    }
  }, [indicators, previousIndicators, indicatorsData, setIndicatorsExpand]);

  return (
    <div className="relative flex h-full grow flex-col space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white py-6 backdrop-blur-xl xl:space-y-4">
      <div className="space-y-2 px-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
            <Link
              href={`/report${searchParams ? `?${searchParams.toString()}` : ""}`}
              className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
            >
              <LuArrowLeft className="h-4 w-4" />
            </Link>
            {t("grid-sidebar-indicators-title")}
          </h1>
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          {t("grid-sidebar-indicators-description")}
        </p>
      </div>

      <div className="px-6">
        <IndicatorsSearch />
      </div>

      <div className="relative !m-0 flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2 bg-gradient-to-b from-white to-transparent xl:h-4" />
        <ScrollArea className="flex grow flex-col" viewportRef={scrollRef}>
          <div className="px-6 py-2 xl:py-4">
            <IndicatorsTopicsList />
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-2 bg-gradient-to-t from-white to-transparent xl:h-4" />
      </div>

      <div
        className={cn("px-6", {
          "pt-2": !!Object.keys(indicatorsExpand || {}).some((k) => indicatorsExpand?.[Number(k)]),
          "pt-5": !Object.keys(indicatorsExpand || {}).some((k) => indicatorsExpand?.[Number(k)]),
        })}
      >
        <IndicatorsFooter />
      </div>
    </div>
  );
}
