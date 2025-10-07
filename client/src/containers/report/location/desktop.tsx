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
      <div className="pointer-events-none z-10 w-full lg:absolute lg:bottom-8 lg:left-0 lg:top-10">
        <div className="container grid grid-cols-12">
          <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
            <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
              <div className="flex max-h-[calc(100vh_-_(64px_+_40px_+_28px))] grow flex-col">
                <div className="relative flex max-h-full grow flex-col overflow-hidden">
                  <a
                    href={HELP_LINKS[locale]}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="absolute right-6 top-6 z-10"
                  >
                    <Button size="sm" variant="outline" type="button" className="gap-2">
                      <LucideHelpCircle className="h-4 w-4 text-secondary-foreground" />

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
                  href={`/report/${card.id}${searchParams ? `?${searchParams.toString()}` : ""}`}
                  key={card.id}
                  className="group pointer-events-auto flex rounded-lg border border-border bg-white p-4 text-left transition-colors duration-300 hover:border-cyan-500"
                >
                  <div className={cn("flex items-start space-x-4")}>
                    <div className="rounded-sm bg-muted p-3 transition-colors duration-300 group-hover:bg-cyan-100">
                      <Icon className="h-5 w-5 text-foreground transition-colors duration-300 group-hover:text-cyan-500" />
                    </div>
                    <div className="flex flex-col items-start justify-start space-y-1">
                      <span className="text-base font-semibold text-primary transition-colors duration-300 group-hover:text-primary">
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
