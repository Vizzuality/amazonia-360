"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

export default function DesktopNavigation() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav className="flex items-center space-x-8 print:hidden">
      <Link
        className={cn({
          "text-sm hover:text-cyan-500": true,
          "text-cyan-500": pathname === "/",
        })}
        href="/"
      >
        {t("header-home")}
      </Link>

      <Link
        className={cn({
          "whitespace-nowrap text-sm hover:text-cyan-500": true,
          "text-cyan-500": pathname.includes("/reports"),
        })}
        href="/reports"
      >
        {t("header-report-tool")}
      </Link>
      <Link
        className={cn({
          "text-sm hover:text-cyan-500": true,
          "text-cyan-500": pathname.includes("/reports/indicators"),
        })}
        href="/reports/indicators"
      >
        {t("header-hub")}
      </Link>

      {/* <Link className="text-blue-600 hover:text-blue-700" href="#">
            Amazonia Forever
          </Link> */}
    </nav>
  );
}
