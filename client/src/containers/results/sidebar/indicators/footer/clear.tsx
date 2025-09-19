"use client";

import { useCallback, useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { useGetDefaultTopics } from "@/lib/topics";

import { useSyncTopics } from "@/app/store";

import { Button } from "@/components/ui/button";

export default function Clear() {
  const t = useTranslations();
  const locale = useLocale();
  const [topics, setTopics] = useSyncTopics();

  const { data: topicsData } = useGetDefaultTopics({ locale });
  const { data: subtopicsData } = useGetDefaultSubtopics({ locale });

  const defaultIndicators = useMemo(
    () =>
      topicsData?.map((topic) => ({
        id: topic.id,
        indicators:
          subtopicsData
            ?.filter((s) => s.topic_id === topic.id)
            .map((s) => s.default_visualization)
            .flat() || [],
      })),
    [topicsData, subtopicsData],
  );

  const indicatorCount =
    topics?.flatMap((topic) => topic.indicators?.map((indicator) => indicator.id))?.length || 0;

  const handleClick = useCallback(() => {
    if (!!topics?.length) {
      setTopics([]);
      return;
    }
    if (!!defaultIndicators) setTopics(defaultIndicators);
  }, [setTopics, topics, defaultIndicators]);

  return (
    <Button variant="secondary" size="sm" onClick={handleClick}>
      <span>{!!topics?.length && topics?.length > 0 ? t("clear-all") : t("select-all")}</span>
      {!!topics?.length && <span>({indicatorCount})</span>}
    </Button>
  );
}
