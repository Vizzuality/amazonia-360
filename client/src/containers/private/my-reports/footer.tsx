"use client";

import { useTranslations } from "next-intl";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

interface MyReportsFooterProps {
  page: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

export const MyReportsFooter = ({
  page,
  totalPages,
  totalDocs,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: MyReportsFooterProps) => {
  const t = useTranslations();

  if (totalDocs === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-muted-foreground text-sm">
        {t("my-reports-showing-page", { page, totalPages })}
        {" • "}
        {t("my-reports-total-reports", { totalDocs })}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
        >
          <LuChevronLeft className="h-4 w-4" />
          <span className="ml-1">{t("my-reports-previous")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          <span className="mr-1">{t("my-reports-next")}</span>
          <LuChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
