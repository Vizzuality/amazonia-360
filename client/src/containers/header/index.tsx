"use client";

import { usePathname } from "next/navigation";

import { useMediaQuery } from "usehooks-ts";

import { cn } from "@/lib/utils";

import DesktopNavigation from "./desktop-navigation";
import LogoBetaInfo from "./logo-beta-info";
import MobileNavigation from "./mobile-navigation";

export default function Header() {
  const isDesktop = useMediaQuery("(min-width: 768px)", { defaultValue: false });
  const pathname = usePathname();
  const isReport = pathname.includes("/report");

  return (
    <header
      className={cn({
        "box-border flex h-16 flex-col justify-center border-b border-blue-50 bg-white backdrop-blur":
          true,
        "border-blue-100": isReport,
      })}
    >
      <div className="container mx-4 flex items-center justify-between md:mx-auto">
        <LogoBetaInfo />

        {isDesktop && <DesktopNavigation />}
        {!isDesktop && <MobileNavigation />}
      </div>
    </header>
  );
}
