"use client";

import { useSyncIndicators } from "@/app/store";

import { Badge } from "@/components/ui/badge";

export function Badges({ topicId, indicatorId }: { topicId: string; indicatorId: string }) {
  const [indicators, setIndicators] = useSyncIndicators();

  const topic = indicators?.find(({ id }) => id === topicId);
  const indicatorsDisplay = topic?.indicators.filter(({ id }) => indicatorId === id);

  const handleClick = () => {
    setIndicators((prevIndicators) => {
      const newIndicators = [...(prevIndicators || [])];

      const topicIndex = newIndicators.findIndex((topic) => topic.id === topicId);

      if (topicIndex >= 0) {
        const indicatorsArray = [...newIndicators[topicIndex].indicators];

        const indicatorIndex = indicatorsArray.findIndex(
          (indicator) => indicator.id === indicatorId,
        );

        if (indicatorIndex >= 0) {
          indicatorsArray.splice(indicatorIndex, 1);
        }

        newIndicators[topicIndex].indicators = indicatorsArray;
      }

      return newIndicators;
    });
  };

  return (
    <div className="space-x-1 py-1.5">
      {indicatorsDisplay?.map(({ type }) => (
        <Badge onClick={handleClick} variant="secondary" className="capitalize" key={type}>
          {type}
        </Badge>
      ))}
    </div>
  );
}
