"use client";

import ReactMarkdown from "react-markdown";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import { formatNumber } from "@/lib/formats";

import { sketchActionAtom } from "@/app/(frontend)/store";

import { BufferSlider } from "@/containers/report/location/buffer/slider";
import { useLocationBuffer } from "@/containers/report/location/buffer/use-location-buffer";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function Confirm({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations();
  const setSketchAction = useSetAtom(sketchActionAtom);

  const {
    location,
    setLocation,
    LOCATION,
    TITLE,
    AREA,
    isCalculating,
    bufferValue,
    onValueChange,
    onValueCommit,
  } = useLocationBuffer();

  if (!location || !LOCATION) return null;

  return (
    <div className="flex w-full flex-col justify-between gap-4 overflow-hidden text-sm">
      <section className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="text-muted-foreground text-sm leading-none font-semibold uppercase">
            {TITLE}
          </div>
          <div className="text-foreground flex items-center gap-1 text-xs leading-none font-bold">
            {isCalculating && <Spinner className="text-muted-foreground size-3" />}
            {formatNumber(AREA, {
              maximumFractionDigits: 0,
            })}{" "}
            km²
          </div>
        </div>
        {location.type !== "search" && (
          <div className="text-muted-foreground text-sm tracking-[0.14px]">
            <ReactMarkdown>{t("grid-sidebar-report-location-note")}</ReactMarkdown>
          </div>
        )}{" "}
        <div className="flex flex-col items-center justify-between gap-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full grow"
            onClick={() => {
              setLocation(null);
              setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
            }}
          >
            {t("grid-sidebar-report-location-button-clear")}
          </Button>

          <Button size="lg" className="w-full grow" onClick={onConfirm}>
            {t("grid-sidebar-report-location-button-confirm")}
          </Button>
        </div>
      </section>

      {location.type !== "search" && LOCATION?.geometry?.type !== "polygon" && (
        <BufferSlider
          bufferValue={bufferValue}
          isCalculating={isCalculating}
          onValueChange={onValueChange}
          onValueCommit={onValueCommit}
        />
      )}
    </div>
  );
}
