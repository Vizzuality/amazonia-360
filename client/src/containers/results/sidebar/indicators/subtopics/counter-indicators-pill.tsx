"use client";

import { useLocale } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";

import { Subtopic } from "@/types/topic";

import { useSyncTopics } from "@/app/(frontend)/store";

export function CounterIndicatorsPill({
  id,
  topic_id,
}: {
  id: Subtopic["id"];
  topic_id: Subtopic["topic_id"];
}) {
  const locale = useLocale();
  const [topics] = useSyncTopics();
  const { data: indicatorsData } = useGetDefaultIndicators({ subtopicId: id, locale });

  const indicators = topics?.find((t) => t.id === topic_id)?.indicators;

  const NUMBER =
    indicators?.filter((i) => !!indicatorsData?.some((ind) => ind.id === i.id)).length || 0;

  if (NUMBER === 0) return null;

  return (
    <span className="flex size-5 items-center justify-center rounded-full border border-border px-1 py-0.5 text-2xs font-semibold text-primary">
      {NUMBER}
    </span>
  );
}
