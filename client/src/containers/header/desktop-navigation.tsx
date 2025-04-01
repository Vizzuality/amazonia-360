import { usePathname } from "next/navigation";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

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
          "text-cyan-500": pathname.includes("/report"),
        })}
        href="/report"
      >
        {t("header-report-tool")}
      </Link>
      <Link
        className={cn({
          "text-sm hover:text-cyan-500": true,
          "text-cyan-500": pathname.includes("/hub"),
        })}
        href="/hub"
      >
        {t("header-hub")}
      </Link>

      {/* <Link className="text-blue-600 hover:text-blue-700" href="#">
            Amazonia Forever
          </Link> */}
    </nav>
  );
}
