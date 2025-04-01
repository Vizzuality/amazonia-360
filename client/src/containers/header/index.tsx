"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Media } from "@/containers/media";

import DesktopNavigation from "./desktop-navigation";
import LogoBetaInfo from "./logo-beta-info";
import MobileNavigation from "./mobile-navigation";
import LanguageSelector from "@/containers/language-selector/desktop";

export default function Header() {
  const pathname = usePathname();
  const isReport = pathname.includes("/report");

  return (
    <header
      className={cn({
        "box-border flex h-16 flex-col justify-center border-b border-blue-50 bg-white backdrop-blur print:hidden":
          true,
        "border-blue-100": isReport,
      })}
    >
      <div className="container flex items-center justify-between md:mx-auto">
        <LogoBetaInfo />

        <Media greaterThanOrEqual="md" className="flex items-center space-x-4">
          <DesktopNavigation />
          <LanguageSelector />
        </Media>

        <Media lessThan="md">
          <MobileNavigation />
        </Media>
      </div>
    </header>
  );
}
