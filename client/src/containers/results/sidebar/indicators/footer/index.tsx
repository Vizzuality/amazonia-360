"use client";

import { useCallback, useMemo } from "react";

import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { useGetDefaultTopics } from "@/lib/topics";

import { indicatorsExpandAtom, useSyncTopics } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";

export default function SidebarIndicatorsFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const [topics, setTopics] = useSyncTopics();

  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);

  const { data: topicsData } = useGetDefaultTopics({ locale });
  const { data: subtopicsData } = useGetDefaultSubtopics({ locale });

  const isAllExpanded = useMemo(() => {
    if (!topicsData) return false;
    return topicsData.some((topic) => !!indicatorsExpand?.[topic.id]);
  }, [indicatorsExpand, topicsData]);

  const handleExpandAll = useCallback(() => {
    if (!isAllExpanded) {
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
    }

    if (isAllExpanded) {
      setIndicatorsExpand({});
    }
  }, [isAllExpanded, topicsData, subtopicsData, setIndicatorsExpand]);

  const handleClear = useCallback(() => {
    if (!!topics?.length) {
      setTopics([]);
      setIndicatorsExpand({});
      return;
    }
  }, [topics, setTopics, setIndicatorsExpand]);

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={handleExpandAll}>
        {isAllExpanded ? t("collapse-all") : t("expand-all")}
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
