"use client";

import { useGetIndicators } from "@/lib/indicators";

import { IndicatorItem } from "@/containers/indicators/item";

export const IndicatorsList = () => {
  const { data } = useGetIndicators({
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
