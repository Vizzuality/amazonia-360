"use client";

import { useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { useAtom, useAtomValue } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { usePreviousDifferent } from "@/lib/hooks";
import { useGetH3Indicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import {
  indicatorsExpandAtom,
  gridSelectedFiltersViewAtom,
  useSyncGridDatasets,
  gridEnabledAtom,
} from "@/app/(frontend)/store";

import GridFooter from "@/containers/report/grid/footer";
import GridIndicatorsList from "@/containers/report/grid/list";
import GridSearch from "@/containers/report/grid/search";
import GridTopicsList from "@/containers/report/grid/topics";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Link } from "@/i18n/navigation";

export default function SidebarGridContent() {
  const locale = useLocale();
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [indicators] = useSyncGridDatasets();
  const previousIndicators = usePreviousDifferent(indicators);

  const { data: indicatorsData } = useGetH3Indicators({ locale });

  const gridSelectedFiltersView = useAtomValue(gridSelectedFiltersViewAtom);
  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);

  const [gridEnabled, setGridEnabled] = useAtom(gridEnabledAtom);

  useEffect(() => {
    const i = indicators ?? [];
    const p = previousIndicators ?? [];
    if (i && p && i.length > p.length) {
      // Get the difference between the two arrays
      const addedIndicatorsIds = i.filter((x) => !p.includes(x));
      const addedIndicators = indicatorsData?.filter((indicator) =>
        addedIndicatorsIds.includes(indicator.resource.column),
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
          <header className="flex w-full items-start gap-2">
            <h1 className="text-primary flex w-full items-center gap-2 pr-56 text-lg leading-tight font-bold">
              {!gridEnabled && (
                <Link
                  href={`/reports${searchParams ? `?${searchParams.toString()}` : ""}`}
                  className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors duration-400 ease-in-out hover:bg-blue-100"
                >
                  <LuArrowLeft className="h-4 w-4" />
                </Link>
              )}

              {gridEnabled && (
                <button
                  onClick={() => setGridEnabled(false)}
                  className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors duration-400 ease-in-out hover:bg-blue-100"
                >
                  <LuArrowLeft className="h-4 w-4" />
                </button>
              )}

              {t("grid-sidebar-grid-filters-title")}
            </h1>
          </header>
        </div>

        <p className="text-muted-foreground text-sm font-medium">
          {t("grid-sidebar-grid-filters-description")}
        </p>
      </div>

      <div className="px-6">
        <GridSearch className="py-0" />
      </div>

      <div className="relative !m-0 flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-50 h-2 bg-gradient-to-b from-white to-transparent xl:h-4" />
        <ScrollArea className="flex grow flex-col">
          <div className="px-6 py-2 xl:py-4">
            {!gridSelectedFiltersView && <GridTopicsList />}
            {gridSelectedFiltersView && <GridIndicatorsList />}
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-50 h-2 bg-gradient-to-t from-white to-transparent xl:h-4" />
      </div>

      <div
        className={cn("px-6", {
          "pt-2": !!Object.keys(indicatorsExpand || {}).some((k) => indicatorsExpand?.[Number(k)]),
          "pt-5": !Object.keys(indicatorsExpand || {}).some((k) => indicatorsExpand?.[Number(k)]),
        })}
      >
        <GridFooter />
      </div>
    </div>
  );
}
