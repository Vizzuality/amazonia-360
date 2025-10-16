"use client";

import { useSearchParams } from "next/navigation";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { FileDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { Link } from "@/i18n/navigation";

export default function ReportButton() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/webshot/report/?${searchParams.toString()}`}
          target="_blank"
          className="block"
        >
          <Button variant="outline" className="space-x-2 border-none px-2.5 py-2 shadow-none">
            <FileDown className="h-5 w-5" />
          </Button>
        </Link>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent side="bottom">
          <span>{t("download")}</span>
          <TooltipArrow />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
