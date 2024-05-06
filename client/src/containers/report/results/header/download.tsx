"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DownloadReport() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          className="space-x-2"
          onClick={() => window.print()}
        >
          <Download className="w-5 h-5" />
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side="top" align="center">
          <div className="text-xxs">Download report</div>

          <TooltipArrow className="fill-foreground" width={10} height={5} />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
