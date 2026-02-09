"use client";

import { useCallback } from "react";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { LuFileText } from "react-icons/lu";

import { useCanEditReport } from "@/lib/report";

import { useReportFormChanged } from "@/app/(frontend)/store";

import { useDuplicateReportCallback, useSaveReportCallback } from "@/containers/results/callbacks";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";

export default function SaveReport() {
  const t = useTranslations();
  const { id } = useParams();

  const router = useRouter();

  const CHANGED = useReportFormChanged();
  const CAN_EDIT = useCanEditReport(`${id}`);

  const { mutation: saveMutation, handleSave } = useSaveReportCallback();

  const duplicateCallback = useCallback(
    (newReportId: string) => {
      router.push(`/reports/${newReportId}`);
    },
    [router],
  );
  const { mutation: duplicateMutation, handleDuplicate } =
    useDuplicateReportCallback(duplicateCallback);

  if (CAN_EDIT) {
    return (
      <Button
        onClick={handleSave}
        className="space-x-2"
        disabled={saveMutation.isPending || !CHANGED}
      >
        {!saveMutation.isPending && <LuFileText className="h-5 w-5" />}
        {saveMutation.isPending && <Spinner className="h-5 w-5" />}
        <span>{t("save")}</span>
      </Button>
    );
  }

  return (
    <Button onClick={handleDuplicate} className="space-x-2" disabled={duplicateMutation.isPending}>
      {!duplicateMutation.isPending && <LuFileText className="h-5 w-5" />}
      {duplicateMutation.isPending && <Spinner className="h-5 w-5" />}
      <span>{t("make-a-copy")}</span>
    </Button>
  );
}
