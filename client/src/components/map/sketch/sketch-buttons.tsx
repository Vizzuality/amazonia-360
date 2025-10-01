"use client";

import { MouseEvent } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { sketchActionAtom, sketchAtom, useSyncLocation } from "@/app/store";

import { SketchProps } from "@/components/map/sketch";
import { buttonVariants } from "@/components/ui/button";
import { PointIcon } from "@/components/ui/icons/point";
import { PolygonIcon } from "@/components/ui/icons/polygon";
import { PolylineIcon } from "@/components/ui/icons/polyline";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipArrow } from "@/components/ui/tooltip";

export default function SketchButtons({ iconOnly = false }: { iconOnly: boolean }) {
  const t = useTranslations();
  const [sketch, setSketch] = useAtom(sketchAtom);
  const setSketchAction = useSetAtom(sketchActionAtom);
  const [, setLocation] = useSyncLocation();

  const handleClick = (e: MouseEvent<HTMLButtonElement>, type: SketchProps["type"]) => {
    e.preventDefault();
    setLocation(null);

    if (sketch.enabled && sketch.type === type) {
      setSketch({ enabled: undefined, type: undefined });
      setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
    }

    if (sketch.enabled && sketch.type !== type) {
      setSketch({ enabled: undefined, type: undefined });

      setTimeout(() => {
        setSketch({ enabled: "create", type });
        setSketchAction({ type: "create", state: "start", geometryType: type });
      }, 0);
    }

    if (!sketch.enabled) {
      setSketch({ enabled: "create", type });
      setSketchAction({ type: "create", state: "start", geometryType: type });
    }
  };

  const DRAWING_BUTTONS = [
    {
      id: "point",
      label: t("grid-sidebar-report-sketch-point"),
      description: t("grid-sidebar-report-sketch-point-description"),
      Icon: PointIcon,
    },
    {
      id: "polygon",
      label: t("grid-sidebar-report-sketch-area"),
      description: t("grid-sidebar-report-sketch-area-description"),
      Icon: PolygonIcon,
    },
    {
      id: "polyline",
      label: t("grid-sidebar-report-sketch-line"),
      description: t("grid-sidebar-report-sketch-line-description"),
      Icon: PolylineIcon,
    },
  ] as const;

  return DRAWING_BUTTONS.map((button) => {
    const Icon = button.Icon;
    return (
      <Tooltip key={button.id}>
        <TooltipTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            sketch.enabled && sketch.type === button.id && buttonVariants({ variant: "default" }),
            "group flex w-full items-center justify-center rounded-md border border-border p-0",
            iconOnly ? "h-10 w-10" : "space-x-2.5 px-4 py-2",
          )}
          aria-label={t("grid-sketch-start-drawing")}
          onClick={(e) => handleClick(e, button.id)}
          type="button"
        >
          <Icon
            className={cn({
              "h-5 w-5": true,
            })}
          />
          {!iconOnly && <span>{button.label}</span>}
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent side={iconOnly ? "bottom" : "top"} align="center" className="max-w-60">
            <div className="text-xxs">{iconOnly ? button.label : button.description}</div>

            <TooltipArrow className="fill-foreground" width={10} height={5} />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  });
}
