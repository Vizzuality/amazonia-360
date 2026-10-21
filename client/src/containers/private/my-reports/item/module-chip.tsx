"use client";

import Image from "next/image";

import { Globe } from "lucide-react";

import { useReportModulesFromEntries } from "@/lib/report/use-report-modules";

import type { Report } from "@/payload-types";

export function ModuleChips({ modules }: Readonly<{ modules: Report["modules"] }>) {
  const reportModules = useReportModulesFromEntries(modules);

  if (!reportModules || reportModules.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {reportModules.map((reportModule) => (
        <div
          key={reportModule.code ?? "amazon-region"}
          data-testid="report-module-chip"
          className="border-border inline-flex h-6 items-center gap-[3px] rounded-md border px-1"
        >
          {reportModule.flagSrc ? (
            <Image
              src={reportModule.flagSrc}
              alt=""
              width={16}
              height={16}
              className="size-4 rounded-[2px] object-cover"
            />
          ) : (
            <Globe className="size-4" aria-hidden />
          )}
          <span className="text-foreground text-xs leading-none font-semibold">
            {reportModule.name}
          </span>
        </div>
      ))}
    </div>
  );
}
