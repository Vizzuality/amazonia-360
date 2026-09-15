"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function ComingSoonBadge({ className }: Readonly<{ className?: string }>) {
  const t = useTranslations();

  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-600 uppercase",
        className,
      )}
    >
      {t("country-module-coming-soon")}
    </span>
  );
}
