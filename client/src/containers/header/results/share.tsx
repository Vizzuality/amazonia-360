"use client";

import { useCallback, useMemo, useState } from "react";

import { useParams } from "next/navigation";

import { DialogTitle } from "@radix-ui/react-dialog";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LuCopy } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ShareReport() {
  const t = useTranslations();
  const locale = useLocale();

  const { id } = useParams();

  const [shareLinkBtnText, setShareLinkBtnText] = useState<"copy" | "copied">("copy");

  const URL = useMemo(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      return `${baseUrl}/${locale}/reports/${id}`;
    }
    return "";
  }, [id, locale]);

  const copyShareLink = useCallback(() => {
    if (!URL) return;

    navigator.clipboard
      .writeText(URL)
      .then(() => {
        setShareLinkBtnText("copied");
        setTimeout(function () {
          setShareLinkBtnText("copy");
        }, 1000);
      })
      .catch((err: ErrorEvent) => {
        console.info(err.message);
      });
  }, [URL]);

  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" className="space-x-2 border-none px-2.5 py-2 shadow-none">
              <Share2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
        </DialogTrigger>

        <DialogContent className="w-full">
          <DialogTitle className="sr-only">{t("report-results-copy-title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("report-results-copy-description")}
          </DialogDescription>
          <div className="mb-6 flex max-w-fit flex-col space-y-2">
            <h3 className="text-lg font-bold text-foreground"> {t("report-results-copy-title")}</h3>

            <p className="text-base font-medium text-muted-foreground">
              {t("report-results-copy-description")}
            </p>
          </div>
          <div className="mb-6 flex w-full space-x-2 overflow-hidden">
            <div className="flex h-10 w-[calc(100%_-_theme(space.32))] rounded-sm border bg-background px-3 py-2 text-sm text-gray-900">
              <p className="truncate text-base font-normal text-foreground">{URL}</p>
            </div>
            <Button className="h-10 w-40 gap-2" onClick={copyShareLink}>
              <LuCopy className="h-4 w-4" />

              <span>{t(`${shareLinkBtnText}`)}</span>
            </Button>
          </div>
          <DialogClose />
        </DialogContent>

        <TooltipPortal>
          <TooltipContent side="bottom">
            <span>{t("share")}</span>
            <TooltipArrow />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </Dialog>
  );
}
