"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuMoveDiagonal2 } from "react-icons/lu";

import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ResizeHandler = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="pointer-events-none absolute -bottom-2.5 -right-3 rounded-full bg-primary p-2"
      >
        <LuMoveDiagonal2 className="h-4 w-4 font-bold text-white" />
      </button>
    </TooltipTrigger>

    <TooltipPortal>
      <TooltipContent side="top" align="center">
        Resize
        <TooltipArrow className="fill-foreground" width={10} height={5} />
      </TooltipContent>
    </TooltipPortal>
  </Tooltip>
);

export default ResizeHandler;
