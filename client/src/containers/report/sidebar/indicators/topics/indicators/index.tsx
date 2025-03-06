"use client";

import { useGetDefaultIndicators } from "@/lib/indicators";

import { Topic } from "@/app/local-api/topics/route";

import { IndicatorsItem } from "./item";

export const Indicators = ({ topic }: { topic: Topic }) => {
  const { data } = useGetDefaultIndicators(topic.id);

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
