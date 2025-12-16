"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";

export const PrintButton = () => {
  const t = useTranslations();

  return (
    <header className="bg-muted py-5 print:hidden">
      <div className="relative mx-auto flex w-[11in] items-center justify-between space-x-2.5">
        <div className="space-y-2">
          <h1 className="text-base font-semibold text-foreground">
            {t("pdf-report-button-title")}
          </h1>
          <Markdown>{t("pdf-report-button-description")}</Markdown>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => {
            window.print();
          }}
        >
          {t("pdf-report-button-text")}
        </Button>
      </div>
    </header>
  );
};

export default PrintButton;
