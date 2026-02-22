"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuInfo } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import Info from "@/containers/info";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function InfoControl({ id, description_short }: Indicator) {
  return (
    <Tooltip delayDuration={100}>
      <Dialog>
        <TooltipTrigger asChild>
          <DialogTrigger className={cn("flex cursor-pointer items-center justify-center p-0.5")}>
            <LuInfo className="text-foreground h-4 w-4" />
          </DialogTrigger>
        </TooltipTrigger>
        <DialogContent className="max-w-2xl p-0">
          <DialogTitle className="sr-only">{description_short}</DialogTitle>
          <Info ids={[id]} />
          <DialogClose />
        </DialogContent>
        <TooltipPortal>
          <TooltipContent sideOffset={0} className="max-w-72">
            {description_short}
            <TooltipArrow />
          </TooltipContent>
        </TooltipPortal>
      </Dialog>
    </Tooltip>
  );
}
