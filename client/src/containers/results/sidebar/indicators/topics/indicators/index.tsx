"use client";

import { useLocale } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";

import { Topic } from "@/types/topic";

import { IndicatorsItem } from "./item";

export const Indicators = ({ topic }: { topic: Topic }) => {
  const locale = useLocale();
  const { data } = useGetDefaultIndicators({ topicId: topic.id, locale });

  return (
    <ul className="space-y-1 p-2 text-sm font-medium">
      {data?.map((indicator) => {
        if (!indicator || !indicator.visualization_types.length) return null;
        return (
          <li key={`${indicator.id}-${topic.id}`}>
            <IndicatorsItem topic={topic} indicator={indicator} />
          </li>
        );
      })}
    </ul>
  );
};
