"use client";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuPen, LuX } from "react-icons/lu";

import { reportEditionModeAtom } from "@/app/(frontend)/store";

import { AuthWrapper } from "@/containers/auth/wrapper";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function EditReport() {
  const t = useTranslations();
  const { open, setOpen } = useSidebar();

  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);

  return (
    <AuthWrapper>
      <Button
        type="button"
        className="space-x-2"
        onClick={() => {
          setReportEditionMode(!reportEditionMode);
          setOpen(!open);
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
    </AuthWrapper>
  );
}
