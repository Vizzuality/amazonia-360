"use client";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuPlus } from "react-icons/lu";

import { reportEditionModeAtom } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function ReportResultsContentSidebarButton() {
  const t = useTranslations();
  const { toggleSidebar } = useSidebar();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);

  return (
    <div className="container hidden w-full lg:block print:hidden">
      <Button
        className="flex w-full space-x-2.5 py-5"
        onClick={() => {
          setReportEditionMode(!reportEditionMode);
          toggleSidebar();
        }}
        variant="outline"
      >
        <LuPlus className="flex h-4 w-4 justify-center rounded-full border-[1.5px] border-blue-700 text-blue-700" />
        <span className="text-sm font-semibold">
          {t("report-results-sidebar-indicators-title")}
        </span>
      </Button>
    </div>
  );
}
