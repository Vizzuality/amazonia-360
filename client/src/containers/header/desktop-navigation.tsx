"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export default function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-8 print:hidden">
      <Link
        className={cn({
          "text-sm hover:text-cyan-500": true,
          "text-cyan-500": pathname === "/",
        })}
        href="/"
      >
        Home
      </Link>

      <Link
        className={cn({
          "text-sm hover:text-cyan-500": true,
          "text-cyan-500": pathname.includes("/report"),
        })}
        href="/report"
      >
        Report Tool
      </Link>
      <Link
        className={cn({
          "text-sm hover:text-cyan-500": true,
          "text-cyan-500": pathname.includes("/hub"),
        })}
        href="/hub"
      >
        Hub
      </Link>

      {/* <Link className="text-blue-600 hover:text-blue-700" href="#">
            Amazonia Forever
          </Link> */}
    </nav>
  );
}
