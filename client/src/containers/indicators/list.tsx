"use client";

import { useIndicators } from "@/lib/indicators";

import { IndicatorItem } from "@/containers/indicators/item";

export const IndicatorsList = () => {
  const { data } = useIndicators({
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    refetchOnReconnect: "always",
  });

  return (
    <ul className="flex flex-col gap-20">
      {data?.map((indicator) => (
        <li key={indicator.id}>
          <IndicatorItem id={indicator.id} />
        </li>
      ))}
    </ul>
  );
};

export default IndicatorsList;
