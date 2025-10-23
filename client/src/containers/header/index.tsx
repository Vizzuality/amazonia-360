"use client";

import { useEffect, useMemo } from "react";

import { Separator } from "@radix-ui/react-select";
import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { reportEditionModeAtom, useSyncLocation } from "@/app/(frontend)/store";

import LanguageSelector from "@/containers/header/language-selector/desktop";
import { Media } from "@/containers/media";

import { useSidebar } from "@/components/ui/sidebar";

import { Link, usePathname } from "@/i18n/navigation";

import ConfirmLocation from "./confirm/desktop";
import DesktopDrawingTools from "./drawing-tools/desktop";
import LogoBetaInfo from "./logo-beta-info";
import MobileNavigation from "./mobile-navigation";
import ReportResultsHeaderDesktop from "./results/desktop";

function getRoutes(pathname: string) {
  const r = pathname.match(/^(?:\/[a-z]{2})?\/report(?:\/(grid|indicators))?\/?$/);
  // I want to know if I'm in home page /, /report or /report/results
  const isHome = pathname === "/";
  const isReport = pathname.startsWith("/report");
  const isReportResults = pathname.includes("/report/results");

  return {
    isHome,
    isReport,
    isReportResults,
    isReportRoot: !!r && !r[1],
    isReportSub: !!r && !!r[1],
  };
}

export default function Header() {
  const pathname = usePathname();

  const t = useTranslations();

  const [location] = useSyncLocation();
  const setEditionMode = useSetAtom(reportEditionModeAtom);

  const { setOpen } = useSidebar();

  const DYNAMIC_HEADER = useMemo(() => {
    const { isHome, isReportSub, isReportResults } = getRoutes(pathname);

    return (
      <>
        {isHome && (
          <Link href="/report" className="text-sm text-foreground hover:text-cyan-500">
            {t("header-report-tool")}
          </Link>
        )}
        {!location && isReportSub && <DesktopDrawingTools />}
        {location && isReportSub && <ConfirmLocation />}
        {isReportResults && <ReportResultsHeaderDesktop />}
        {(isReportResults || isReportSub) && <Separator className="h-4 w-px bg-border" />}
      </>
    );
  }, [pathname, location, t]);

  useEffect(() => {
    // Hide sidebar when navigating away from report
    // Remove edit mode
    if (!pathname.includes("/report/results")) {
      setOpen(false);
      setEditionMode(false);
    }
  }, [pathname, setOpen, setEditionMode]);

  return (
    <header
      className={cn({
        "fixed left-0 top-0 z-40 w-full": true,
        "box-border flex h-16 flex-col justify-center border-b border-blue-50 bg-white backdrop-blur print:hidden": true,
        // "border-blue-100": isReport,
      })}
    >
      <div className="container flex items-center justify-between md:mx-auto">
        <LogoBetaInfo />
        <Media greaterThanOrEqual="md" className="flex items-center space-x-4">
          {DYNAMIC_HEADER}
          <LanguageSelector />
        </Media>

        <Media lessThan="md">
          <MobileNavigation />
        </Media>
      </div>
    </header>
  );
}
