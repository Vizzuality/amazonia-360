"use client";

import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuPen, LuX } from "react-icons/lu";

import { reportEditionModeAtom, resultsSidebarTabAtom } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function IndicatorsReport() {
  const t = useTranslations();
  const { open, setOpen } = useSidebar();
  const setResultsSidebarTab = useSetAtom(resultsSidebarTabAtom);

  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);

  return (
    <Button
      className="space-x-2"
      onClick={() => {
        setReportEditionMode(!reportEditionMode);
        setOpen(!open);
        setResultsSidebarTab("indicators");
      }}
      variant="outline"
    >
      {!open && (
        <>
          <LuPen className="h-5 w-5" />
          <span>{t("report-results-buttons-edit-report")}</span>
        </>
      )}

      {open && (
        <>
          <LuX className="h-5 w-5" />
          <span>{t("report-results-buttons-edit-close-report")}</span>
        </>
      )}
    </Button>
  );
}
