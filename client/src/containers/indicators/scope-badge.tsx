"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import { Badge } from "@/components/ui/badge";

export function IndicatorScopeBadge({
  module: indicatorModule,
  className,
}: Readonly<{
  module: Indicator["module"];
  className?: string;
}>) {
  const t = useTranslations();

  return (
    <Badge
      variant="outline"
      // The badge sits inside the row's button, so without this the control's accessible name
      // becomes "REG Altitude range". The scope is not lost: module indicators carry it in
      // their own name, and the list has explicit scope tabs.
      aria-hidden
      className={cn(
        "text-2xs h-4 w-8 shrink-0 justify-center rounded border-transparent px-0 py-0 font-semibold",
        indicatorModule ? "text-foreground bg-cyan-200" : "bg-muted text-foreground",
        className,
      )}
    >
      {indicatorModule?.tag ?? t("country-module-badge-regional")}
    </Badge>
  );
}
