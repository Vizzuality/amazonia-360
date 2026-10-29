"use client";

import { useLocale } from "use-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { useReportCountry } from "@/lib/report/use-report-country";
import { useFormTopics } from "@/lib/url-state/store";

import { Subtopic } from "@/types/topic";

export function CounterIndicatorsPill({
  id,
  topic_id,
}: {
  id: Subtopic["id"];
  topic_id: Subtopic["topic_id"];
}) {
  const locale = useLocale();
  const { topics } = useFormTopics();
  const country = useReportCountry();
  const { data: indicatorsData } = useGetDefaultIndicators({ subtopicId: id, locale, country });

  const indicators = topics?.find((t) => t.topic_id === topic_id)?.indicators;

  const NUMBER =
    indicators?.filter((i) => !!indicatorsData?.some((ind) => ind.id === i.indicator_id)).length ||
    0;

  if (NUMBER === 0) return null;

  return (
    <span className="flex size-5 items-center justify-center rounded-full border border-border px-1 py-0.5 text-2xs font-semibold text-primary">
      {NUMBER}
    </span>
  );
}
