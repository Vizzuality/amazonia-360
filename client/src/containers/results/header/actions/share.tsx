"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuCopy, LuShare2 } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportResultsActionsProps } from "./types";

export const ShareAction = ({ reportId }: ReportResultsActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [shareLinkBtnText, setShareLinkBtnText] = useState<"copy" | "copied">("copy");

  const URL = useMemo(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      return `${baseUrl}/${locale}/reports/${reportId}`;
    }
    return "";
  }, [reportId, locale]);

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
      .catch((err: Error) => {
        console.error("Failed to copy:", err.message);
      });
  }, [URL]);

  return (
    <>
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
      >
        <LuShare2 className="mr-2 h-4 w-4 shrink-0" />
        <span>{t("share")}</span>
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full">
          <DialogTitle className="sr-only">{t("report-results-copy-title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("report-results-copy-description")}
          </DialogDescription>
          <div className="mb-6 flex max-w-fit flex-col space-y-2">
            <h3 className="text-lg font-bold text-foreground">{t("report-results-copy-title")}</h3>
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
      </Dialog>
    </>
  );
};
