"use client";

import { FC } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuInfo } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Indicator } from "@/app/local-api/indicators/route";

import Info from "@/containers/info";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CONTROL_BUTTON_STYLES } from "./constants";

interface InfoControlProps {
  className?: string;
  ids: Indicator["id"][];
}

export const InfoControl: FC<InfoControlProps> = ({ ids, className }: InfoControlProps) => {
  return (
    <Tooltip>
      <Dialog>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <button
              className={cn({
                [CONTROL_BUTTON_STYLES.default]: true,
                [CONTROL_BUTTON_STYLES.hover]: true,
                [CONTROL_BUTTON_STYLES.active]: true,
                "p-1.5": true,
                [`${className}`]: !!className,
              })}
              aria-label="Fullscreen in"
              type="button"
            >
              <LuInfo className="h-full w-full" />
            </button>
          </DialogTrigger>
        </TooltipTrigger>

        <DialogContent className="p-0">
          <DialogTitle className="sr-only">About the data</DialogTitle>
          <Info ids={ids} />
          <DialogClose />
        </DialogContent>

        <TooltipPortal>
          <TooltipContent side="left" align="center">
            <div className="text-xxs">About the data</div>

            <TooltipArrow className="fill-foreground" width={10} height={5} />
          </TooltipContent>
        </TooltipPortal>
      </Dialog>
    </Tooltip>
  );
};

export default InfoControl;
