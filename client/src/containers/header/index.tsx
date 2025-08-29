"use client";

import { useMemo } from "react";

import { Separator } from "@radix-ui/react-select";

import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/store";

import LanguageSelector from "@/containers/header/language-selector/desktop";
import { Media } from "@/containers/media";

import { usePathname } from "@/i18n/navigation";

import ReportResultsHeaderDesktop from "../results/header/desktop";

import ConfirmLocation from "./confirm/desktop";
import DesktopDrawingTools from "./drawing-tools/desktop";
import LogoBetaInfo from "./logo-beta-info";
import MobileNavigation from "./mobile-navigation";

function getRoutes(pathname: string) {
  const m = pathname.match(/^(?:\/[a-z]{2})?\/report(?:\/(grid|indicators))?\/?$/);
  return {
    isInReport: !!m,
    isReportRoot: !!m && !m[1],
    isReportSub: !!m && !!m[1],
  };
}

export default function Header() {
  const pathname = usePathname();

  const [location] = useSyncLocation();

  const DYNAMIC_HEADER = useMemo(() => {
    const { isReportSub } = getRoutes(pathname);
    const isReportResults = pathname.includes("/report/results");

    return (
      <>
        {!location && isReportSub && <DesktopDrawingTools />}
        {location && isReportSub && <ConfirmLocation />}
        {isReportResults && <ReportResultsHeaderDesktop />}
        {(isReportSub || isReportResults) && <Separator className="h-4 w-px bg-border" />}
      </>
    );
  }, [pathname, location]);

  return (
    <header
      className={cn({
        "box-border flex h-16 flex-col justify-center border-b border-blue-50 bg-white backdrop-blur print:hidden":
          true,
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
