"use client";

import { FC, useCallback, useMemo, useRef, useState } from "react";

import FullscreenVM from "@arcgis/core/widgets/Fullscreen/FullscreenViewModel";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuExpand, LuMinimize } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { useMap } from "@/components/map/provider";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CONTROL_BUTTON_STYLES } from "./constants";

interface FullscreenControlProps {
  className?: string;
}

export const FullscreenControl: FC<FullscreenControlProps> = ({
  className,
}: FullscreenControlProps) => {
  const t = useTranslations();
  const fullscreenModelViewRef = useRef<FullscreenVM>();
  const [active, setActive] = useState(false);

  const map = useMap();

  useMemo(() => {
    if (!fullscreenModelViewRef.current && map?.view) {
      fullscreenModelViewRef.current = new FullscreenVM({
        view: map?.view,
        element: map?.view?.container,
      });
    }
  }, [map?.view]);

  const handleFullscreen = useCallback(() => {
    setActive(!active);
    fullscreenModelViewRef.current?.toggle();
  }, [active]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn({
            [CONTROL_BUTTON_STYLES.default]: true,
            [CONTROL_BUTTON_STYLES.hover]: true,
            [CONTROL_BUTTON_STYLES.active]: true,
            [`${className}`]: !!className,
          })}
          aria-label={t("fullscreen-in")}
          type="button"
          onClick={handleFullscreen}
        >
          {!active && <LuExpand className="h-full w-full" />}
          {active && <LuMinimize className="h-full w-full" />}
        </button>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent side="left" align="center">
          <div className="text-xxs">{t("fullscreen")}</div>

          <TooltipArrow className="fill-foreground" width={10} height={5} />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

export default FullscreenControl;
