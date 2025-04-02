"use client";

import { useLocale } from "next-intl";

import { useGetIndicators } from "@/lib/indicators";

import { IndicatorItem } from "@/containers/indicators/item";

export const IndicatorsList = () => {
  const locale = useLocale();
  const { data } = useGetIndicators(locale, {
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
