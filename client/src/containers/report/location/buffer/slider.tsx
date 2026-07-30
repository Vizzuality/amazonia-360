"use client";

import { useTranslations } from "next-intl";

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
        <div className="text-foreground flex items-center gap-1 text-xs leading-none">
          {isCalculating && <Spinner className="text-muted-foreground size-3" />}
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
          onValueChange={onValueChange}
          onValueCommit={onValueCommit}
        />

        <div className="text-2xs text-muted-foreground flex w-full justify-between font-bold">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>
    </section>
  );
}
