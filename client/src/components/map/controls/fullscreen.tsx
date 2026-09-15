"use client";

import { FC, useCallback, useEffect, useState } from "react";

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
  const map = useMap();

  const [active, setActive] = useState(false);

  const handleFullscreen = useCallback(() => {
    const container = map?.view?.container;
    if (!container) return;

    if (document.fullscreenElement === container) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen().catch(() => undefined);
    }
  }, [map?.view?.container]);

  useEffect(() => {
    const container = map?.view?.container;

    const handleFullscreenChange = () => setActive(document.fullscreenElement === container);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [map?.view?.container]);

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
