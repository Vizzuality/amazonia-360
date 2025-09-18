"use client";

import { useLocale } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";

import { Subtopic, Topic } from "@/types/topic";

import { IndicatorsItem } from "./item";

export const IndicatorsList = ({
  topicId,
  subtopicId,
}: {
  topicId: Topic["id"];
  subtopicId: Subtopic["id"];
}) => {
  const locale = useLocale();
  const { data } = useGetDefaultIndicators({ subtopicId: subtopicId, locale });

  return (
    <ul className="space-y-1 p-2 text-sm font-medium">
      {data?.map((indicator) => {
        if (!indicator || !indicator.visualization_types.length) return null;
        return (
          <li key={`${indicator.id}-${subtopicId}`}>
            <IndicatorsItem topicId={topicId} indicator={indicator} />
          </li>
        );
      })}
    </ul>
  );
};

export default IndicatorsList;
