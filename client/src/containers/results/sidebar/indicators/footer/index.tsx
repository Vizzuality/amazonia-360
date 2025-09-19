"use client";

import { useCallback } from "react";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { useGetDefaultTopics } from "@/lib/topics";

import { indicatorsExpandAtom, useSyncTopics } from "@/app/store";

import { Button } from "@/components/ui/button";

export default function SidebarIndicatorsFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const [topics, setTopics] = useSyncTopics();

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

  const handleClear = useCallback(() => {
    if (!!topics?.length) {
      setTopics([]);
      return;
    }
  }, [topics, setTopics]);

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={handleExpandAll}>
        {t("expand-all")}
      </Button>

      <Button variant="secondary" size="sm" className="space-x-1" onClick={handleClear}>
        <span>{t("clear-all")}</span>

        {!!topics?.length && (
          <span>({topics.reduce((acc, topic) => acc + (topic?.indicators?.length ?? 0), 0)})</span>
        )}
      </Button>
    </div>
  );
}
