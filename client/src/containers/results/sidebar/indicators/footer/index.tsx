"use client";

import { useCallback } from "react";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { useGetDefaultTopics } from "@/lib/topics";

import { indicatorsExpandAtom } from "@/app/store";

import Clear from "@/containers/results/sidebar/indicators/footer/clear";

import { Button } from "@/components/ui/button";

export default function SidebarIndicatorsFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const setIndicatorsExpand = useSetAtom(indicatorsExpandAtom);

  const { data: topicsData } = useGetDefaultTopics({ locale });
  const { data: subtopicsData } = useGetDefaultSubtopics({ locale });

  const handleExpandAll = useCallback(() => {
    setIndicatorsExpand(() => {
      return topicsData?.reduce(
        (acc, topic) => {
          acc[topic.id] = subtopicsData
            ?.filter((subtopic) => subtopic.topic_id === topic.id)
            .map((subtopic) => subtopic.id) as number[];
          return acc;
        },
        {} as Record<number, number[]>,
      );
    });
  }, [topicsData, subtopicsData, setIndicatorsExpand]);

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={handleExpandAll}>
        {t("expand-all")}
      </Button>

      <Clear />
    </div>
  );
}
