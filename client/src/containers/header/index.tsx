"use client";

// import { useMedia } from "react-use";

import DesktopNavigation from "./desktop-navigation";
// import MobileNavigation from "./mobile-navigation";
import LogoBetaInfo from "./logo-beta-info";

export default function Header() {
  // const isDesktop = useMedia("(min-width: 768px)");
  //
  return (
    <header className="flex h-16 flex-col justify-center bg-white backdrop-blur">
      <div className="container mx-auto flex items-center justify-between">
        <LogoBetaInfo />

        {/* {isDesktop &&  */}
        <DesktopNavigation />
        {/* } */}
        {/* {!isDesktop && <MobileNavigation />} */}
      </div>
    </header>
  );
}
