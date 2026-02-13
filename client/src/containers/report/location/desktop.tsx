"use client";

import { useSearchParams } from "next/navigation";

import { LucideHelpCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LuDatabase } from "react-icons/lu";

import { cn } from "@/lib/utils";

import SidebarLocationContent from "@/containers/report/location/content-desktop";

import { Button } from "@/components/ui/button";
import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Link } from "@/i18n/navigation";

const HELP_LINKS = {
  en: "https://rise.articulate.com/share/GWlgAGqnPZihWgXVpLCGge4Pjjk9k2Wo#/?locale=en-us",
  es: "https://rise.articulate.com/share/GWlgAGqnPZihWgXVpLCGge4Pjjk9k2Wo#/",
  pt: "https://rise.articulate.com/share/GWlgAGqnPZihWgXVpLCGge4Pjjk9k2Wo#/?locale=pt-br",
};

export default function ReportLocationDesktop() {
  const searchParams = useSearchParams();

  const locale = useLocale();
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
      <div className="pointer-events-none z-10 w-full lg:absolute lg:top-10 lg:bottom-8 lg:left-0">
        <div className="container grid grid-cols-12">
          <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
            <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
              <div className="flex max-h-[calc(100vh-(64px+40px+28px))] grow flex-col">
                <div className="relative flex max-h-full grow flex-col overflow-hidden">
                  <a
                    href={HELP_LINKS[locale]}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="absolute top-6 right-6 z-10"
                  >
                    <Button size="sm" variant="outline" type="button" className="gap-2">
                      <LucideHelpCircle className="text-secondary-foreground h-4 w-4" />

                      <span>{t("help")}</span>
                    </Button>
                  </a>
                  <ScrollArea className="h-full w-full grow">
                    <SidebarLocationContent />
                  </ScrollArea>
                </div>
              </div>
            </aside>

            {SIDEBAR_CARDS.map((card) => {
              const Icon = card.Icon;

              return (
                <Link
                  href={`/reports/${card.id}${searchParams ? `?${searchParams.toString()}` : ""}`}
                  key={card.id}
                  className="group border-border pointer-events-auto flex rounded-lg border bg-white p-4 text-left transition-colors duration-300 hover:border-cyan-500"
                >
                  <div className={cn("flex items-start space-x-4")}>
                    <div className="bg-muted rounded-xs p-3 transition-colors duration-300 group-hover:bg-cyan-100">
                      <Icon className="text-foreground h-5 w-5 transition-colors duration-300 group-hover:text-cyan-500" />
                    </div>
                    <div className="flex flex-col items-start justify-start space-y-1">
                      <span className="text-primary group-hover:text-primary text-base font-semibold transition-colors duration-300">
                        {card.title}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium">
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
