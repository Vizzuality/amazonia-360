"use client";

import { ReactNode } from "react";

import { useFormatter, useTranslations } from "next-intl";

import { useReportModules } from "@/lib/report/use-report-modules";
import { cn } from "@/lib/utils";

function getBoldChunks(chunks: ReactNode) {
  return <span className="font-semibold">{chunks}</span>;
}

export default function ModuleReport({ className }: Readonly<{ className?: string }>) {
  const t = useTranslations();
  const format = useFormatter();
  const modules = useReportModules();

  if (!modules) return null;

  return (
    <p
      data-testid="report-module-note"
      className={cn("text-muted-foreground text-sm leading-5 font-normal italic", className)}
    >
      {t.rich("country-module-report-note", {
        names: format.list(modules.map((module) => module.name)),
        count: modules.length,
        b: getBoldChunks,
      })}
    </p>
  );
}
