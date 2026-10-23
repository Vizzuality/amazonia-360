"use client";

import { useTranslations } from "next-intl";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { Indicator } from "@/types/indicator";

export function getIndicatorInfoTooltipClassName(): string {
  return isFeatureEnabled("country-module") ? "max-w-[300px] p-3" : "max-w-72";
}

export function IndicatorInfoTooltipBody({
  description,
  partners,
}: Readonly<{ description: string; partners: Indicator["partners"] }>) {
  const t = useTranslations();

  if (!isFeatureEnabled("country-module")) return description;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{description}</p>
      {partners.length > 0 && (
        <>
          <div className="h-px bg-blue-400" />
          <p className="text-2xs text-muted font-semibold tracking-[0.4px] uppercase">
            {t("indicator-partners")}
          </p>
          <ul className="flex flex-col gap-2">
            {partners.map(({ id, name }) => (
              <li key={id} className="flex items-center gap-2 text-xs leading-[1.2] font-medium">
                <span aria-hidden className="size-[4.48px] shrink-0 rounded-full bg-cyan-600" />
                {name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
