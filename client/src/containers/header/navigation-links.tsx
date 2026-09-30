"use client";

import { Separator } from "@radix-ui/react-select";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Link, LocaleLink, usePathname } from "@/i18n/navigation";

function getItemClassName(active: boolean): string {
  return cn(
    "text-foreground rounded-md px-3 py-1.5 text-sm leading-5 font-semibold hover:text-cyan-500",
    { "bg-blue-50 text-cyan-700 hover:text-cyan-700": active },
  );
}

function getAriaCurrent(active: boolean): "page" | undefined {
  return active ? "page" : undefined;
}

export default function NavigationLinks() {
  const t = useTranslations();
  const pathname = usePathname();

  const isReport = pathname.startsWith("/reports");
  const isPartners = pathname === "/partners";

  return (
    <>
      <Link
        href="/reports"
        aria-current={getAriaCurrent(isReport)}
        className={getItemClassName(isReport)}
      >
        {t("header-report-tool")}
      </Link>
      <LocaleLink
        href="/partners"
        aria-current={getAriaCurrent(isPartners)}
        className={getItemClassName(isPartners)}
      >
        {t("header-partners")}
      </LocaleLink>
      <Separator className="bg-border h-6 w-px" />
    </>
  );
}
