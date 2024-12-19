import { Topic } from "@/app/local-api/topics/route";

import { IndicatorsItem } from "./item";

export const Indicators = ({ topic }: { topic: Topic }) => {
  return (
    <ul className="space-y-1 py-2 pl-6 text-sm font-medium">
      {topic?.indicators?.map((indicator) => (
        <li key={`${indicator.id}-${topic.id}`}>
          <IndicatorsItem topic={topic} indicator={indicator} />
        </li>
      ))}
    </ul>
  );
};
