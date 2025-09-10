"use client";

import { useCallback } from "react";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultTopics } from "@/lib/topics";

import { indicatorsExpandAtom, useSyncIndicators } from "@/app/store";

import { Button } from "@/components/ui/button";

export default function IndicatorsFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const [indicators, setIndicators] = useSyncIndicators();
  const setIndicatorsExpand = useSetAtom(indicatorsExpandAtom);

  const { data: topicsData } = useGetDefaultTopics({ locale });

  const handleExpandAll = useCallback(() => {
    setIndicatorsExpand(() => {
      return topicsData?.reduce(
        (acc, topic) => {
          acc[topic.id] = [];
          return acc;
        },
        {} as Record<number, number[]>,
      );
    });
  }, [topicsData, setIndicatorsExpand]);

  const handleClear = () => {
    setIndicators(null);
  };

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={handleExpandAll}>
        Expand all
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleClear}
        disabled={!indicators?.length}
        className="space-x-1"
      >
        <span>{t("grid-sidebar-grid-filters-button-clear-selection")}</span>
        <span>({indicators?.length ?? 0})</span>
      </Button>
    </div>
  );
}
