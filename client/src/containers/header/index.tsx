"use client";

import { useMedia } from "react-use";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import DesktopNavigation from "./desktop-navigation";
import LogoBetaInfo from "./logo-beta-info";
import MobileNavigation from "./mobile-navigation";

export default function Header() {
  const isDesktop = useMedia("(min-width: 768px)");
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
      <div className="mx-4 flex items-center justify-between md:container md:mx-auto">
        <LogoBetaInfo />

        {isDesktop && <DesktopNavigation />}
        {!isDesktop && <MobileNavigation />}
      </div>
    </header>
  );
}
