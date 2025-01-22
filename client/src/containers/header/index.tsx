"use client";

import { useMedia } from "react-use";

import DesktopNavigation from "./desktop-navigation";
import LogoBetaInfo from "./logo-beta-info";
import MobileNavigation from "./mobile-navigation";

export default function Header() {
  const isDesktop = useMedia("(min-width: 768px)");

  return (
    <header className="box-border flex h-16 flex-col justify-center bg-white backdrop-blur">
      <div className="mx-4 flex items-center justify-between md:container md:mx-auto">
        <LogoBetaInfo />

        {isDesktop && <DesktopNavigation />}
        {!isDesktop && <MobileNavigation />}
      </div>
    </header>
  );
}
