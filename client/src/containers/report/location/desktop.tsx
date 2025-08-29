"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { LuDatabase } from "react-icons/lu";

import { cn } from "@/lib/utils";

import SidebarLocationContent from "@/containers/report/location/tabs/location";

import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { ScrollArea } from "@/components/ui/scroll-area";

import SidebarGridContent from "./tabs/filters";
import SidebarIndicatorsContent from "./tabs/topics";

export default function ReportLocationDesktop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isGrid = pathname.includes("/report/grid");
  const isIndicators = pathname.includes("/report/indicators");
  const isReport = pathname.includes("/report") && !isGrid && !isIndicators;

  const t = useTranslations();

  const SIDEBAR_CARDS = [
    {
      id: "grid",
      title: t("sidebar-report-grid-title"),
      description: t("sidebar-report-grid-description"),
      Icon: HexagonIcon,
    },
    {
      id: "indicators",
      title: t("sidebar-report-indicators-title"),
      description: t("sidebar-report-indicators-description"),
      Icon: LuDatabase,
    },
  ] as const;

  return (
    <>
      <div className="pointer-events-none z-10 w-full lg:absolute lg:bottom-8 lg:left-0 lg:top-10">
        <div className="container grid grid-cols-12">
          <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
            <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
              <div className="test-class flex max-h-[calc(100vh_-_(64px_+_40px_+_28px))] grow flex-col">
                <div className="flex max-h-full grow flex-col overflow-hidden">
                  <ScrollArea className="h-full w-full grow">
                    {isReport && <SidebarLocationContent />}
                    {isGrid && <SidebarGridContent />}
                    {isIndicators && <SidebarIndicatorsContent />}
                  </ScrollArea>
                </div>
              </div>
            </aside>
            {isReport &&
              SIDEBAR_CARDS.map((card) => {
                const Icon = card.Icon;
                return (
                  <Link
                    href={`/report/${card.id}${searchParams ? `?${searchParams.toString()}` : ""}`}
                    key={card.id}
                    className="pointer-events-auto flex rounded-lg border border-border bg-white p-4 text-left transition-all duration-500 hover:bg-blue-100"
                  >
                    <div
                      className={cn(
                        "flex items-start space-x-2.5 transition-transform duration-300",
                      )}
                    >
                      <div className="rounded-sm bg-cyan-100 p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col items-start justify-start space-y-1">
                        <span className="text-base font-semibold text-muted-foreground transition-none">
                          {card.title}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {card.description}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
