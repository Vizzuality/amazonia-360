"use client";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuPen } from "react-icons/lu";

import { reportEditionModeAtom } from "@/app/store";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function IndicatorsReport() {
  const t = useTranslations();
  const { toggleSidebar } = useSidebar();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);

  return (
    <Button
      className="space-x-2"
      onClick={() => {
        setReportEditionMode(!reportEditionMode);
        toggleSidebar();
      }}
      variant="outline"
    >
      <LuPen className="h-5 w-5" />
      <span>{t("report-results-buttons-edit-report")}</span>
    </Button>
  );
}
