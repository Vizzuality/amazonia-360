"use client";

import { useCallback } from "react";

import { useTranslations } from "next-intl";
import { LuCopy } from "react-icons/lu";

import { useDuplicateReportCallback } from "@/containers/results/callbacks";

import { DropdownMenuItem } from "@/components/ui/dropdown";
import { Spinner } from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";

import type { ReportResultsActionsProps } from "./types";

export const DuplicateAction = (_props: ReportResultsActionsProps) => {
  const t = useTranslations();
  const router = useRouter();

  const duplicateCallback = useCallback(
    (newReportId: string) => {
      router.replace(`/reports/${newReportId}`);
    },
    [router],
  );

  const { mutation: duplicateMutation, handleDuplicate } =
    useDuplicateReportCallback(duplicateCallback);

  return (
    <DropdownMenuItem
      disabled={duplicateMutation.isPending}
      onClick={(e) => {
        e.preventDefault();
        handleDuplicate();
      }}
      className="cursor-pointer"
    >
      {!duplicateMutation.isPending && <LuCopy className="mr-2 h-4 w-4 shrink-0" />}
      {duplicateMutation.isPending && <Spinner className="mr-2 h-4 w-4 shrink-0" />}
      <span>{t("report-results-action-duplicate")}</span>
    </DropdownMenuItem>
  );
};
