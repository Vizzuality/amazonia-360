"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Media } from "@/containers/media";

import DesktopNavigation from "./desktop-navigation";
import LogoBetaInfo from "./logo-beta-info";
import MobileNavigation from "./mobile-navigation";

export default function Header() {
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

        <Media greaterThanOrEqual="md">
          <DesktopNavigation />
        </Media>

        <Media lessThan="md">
          <MobileNavigation />
        </Media>
      </div>
    </header>
  );
}
