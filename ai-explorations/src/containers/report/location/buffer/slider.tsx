"use client";

import { useTranslations } from "use-intl";

import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";

export function BufferSlider({
  bufferValue,
  isCalculating,
  onValueChange,
  onValueCommit,
}: Readonly<{
  bufferValue: number;
  isCalculating: boolean;
  onValueChange: (value: number[]) => void;
  onValueCommit: () => void;
}>) {
  const t = useTranslations();

  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between">
        <div className="text-sm leading-none font-semibold text-blue-500">
          {t("grid-sidebar-report-location-buffer-size")}
        </div>
        <div className="flex items-center gap-1 text-xs leading-none text-foreground">
          {isCalculating && <Spinner className="size-3 text-muted-foreground" />}
          {`${bufferValue} km`}
        </div>
      </div>
      <div className="space-y-1 px-1">
        <Slider
          min={1}
          max={100}
          step={1}
          value={[bufferValue]}
          minStepsBetweenThumbs={1}
          thumbLabel={t("grid-sidebar-report-location-buffer-size")}
          onValueChange={onValueChange}
          onValueCommit={onValueCommit}
        />

        <div className="flex w-full justify-between text-2xs font-bold text-muted-foreground">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>
    </section>
  );
}
