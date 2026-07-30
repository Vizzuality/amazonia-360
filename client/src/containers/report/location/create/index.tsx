"use client";

import { ReactNode } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuPen, LuTrash2 } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";

import { sketchActionAtom, sketchAtom } from "@/app/(frontend)/store";

import { BufferSlider } from "@/containers/report/location/buffer/slider";
import { useLocationBuffer } from "@/containers/report/location/buffer/use-location-buffer";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function CreateReport({ children }: { children?: ReactNode }) {
  const t = useTranslations();
  const [sketch, setSketch] = useAtom(sketchAtom);
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
    <div className="flex w-full flex-col justify-between gap-4 overflow-hidden bg-white text-sm">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-muted-foreground text-sm leading-none font-semibold uppercase">
            {TITLE}
          </div>
          <div className="text-foreground flex items-center gap-1 text-base leading-none font-bold">
            {isCalculating && <Spinner className="text-muted-foreground size-3.5" />}
            {formatNumber(AREA, {
              maximumFractionDigits: 0,
            })}{" "}
            km²
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="px-5"
                onClick={() => {
                  setLocation(null);
                  setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
                }}
              >
                <LuTrash2 className="h-5 w-5 text-current" />
                {/* {t("grid-sidebar-report-location-button-clear")} */}
              </Button>
            </TooltipTrigger>

            <TooltipPortal>
              <TooltipContent side="top" align="center">
                {t("grid-sidebar-report-location-button-clear")}
                <TooltipArrow className="fill-foreground" width={10} height={5} />
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          {location.type !== "search" && (
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant={sketch.enabled === "edit" ? "default" : "outline"}
                  className="px-5"
                  onClick={() => {
                    setSketch({
                      enabled: sketch.enabled === "edit" ? undefined : "edit",
                    });
                  }}
                >
                  <LuPen className="h-5 w-5 text-current" />
                </Button>
              </TooltipTrigger>

              <TooltipPortal>
                <TooltipContent side="top" align="center">
                  {sketch.enabled === "edit"
                    ? t("drawing-tools-edit-cancel")
                    : t("drawing-tools-edit")}
                  <TooltipArrow className="fill-foreground" width={10} height={5} />
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {children}

          {/* <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full grow">
                {t("landing-key-features-grid-buttons-create-report")}
              </Button>
            </DialogTrigger>

            <DialogContent className="p-0">
              <DialogTitle className="sr-only">
                {t("landing-key-features-grid-buttons-create-report")}
              </DialogTitle>
              <ReportGenerate />
              <DialogClose />
            </DialogContent>
          </Dialog> */}
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

      {/* {location.type !== "search" && (
        <div className="text-sm tracking-[0.14px] text-muted-foreground">
          <ReactMarkdown>{t("grid-sidebar-report-location-note")}</ReactMarkdown>
        </div>
      )} */}
    </div>
  );
}
