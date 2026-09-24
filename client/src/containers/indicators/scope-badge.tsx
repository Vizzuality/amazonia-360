"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import { Badge } from "@/components/ui/badge";

export function getIndicatorScopeBadgeKey(country: Indicator["country"]): string {
  return country ? `country-module-${country}-badge` : "country-module-badge-regional";
}

export function IndicatorScopeBadge({
  country,
  className,
}: Readonly<{
  country: Indicator["country"];
  className?: string;
}>) {
  const t = useTranslations();

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-2xs h-4 w-8 shrink-0 justify-center rounded border-transparent px-0 py-0 font-semibold",
        country ? "text-foreground bg-cyan-200" : "bg-muted text-foreground",
        className,
      )}
    >
      {t(getIndicatorScopeBadgeKey(country) as Parameters<typeof t>[0])}
    </Badge>
  );
}
