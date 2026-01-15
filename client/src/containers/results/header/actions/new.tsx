"use client";

import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import { Link } from "@/i18n/navigation";

export const NewReportAction = () => {
  const t = useTranslations();

  return (
    <>
      <Link href="/reports">
        <DropdownMenuItem className="cursor-pointer">
          <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
          <span>{t("report-results-buttons-new-report")}</span>
        </DropdownMenuItem>
      </Link>
    </>
  );
};
