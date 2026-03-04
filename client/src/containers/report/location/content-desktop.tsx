"use client";

import { useTranslations } from "next-intl";

import useIsMounted from "@/lib/mounted";
import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/(frontend)/store";

import ReportGenerate from "@/containers/report/generate";
import Create from "@/containers/report/location/create";
import SearchLocation from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarLocationContent() {
  const [location] = useSyncLocation();
  const t = useTranslations();

  const isMounted = useIsMounted();

  return (
    <div
      className={cn({
        "relative space-y-6 overflow-hidden rounded-lg bg-white py-6": true,
        "lg:border lg:border-blue-100 lg:p-6": true,
      })}
    >
      <div className="space-y-4">
        <h1 className="text-primary pr-24 text-2xl font-bold">{t("grid-sidebar-report-title")}</h1>

        <p className="text-muted-foreground text-sm font-medium">
          {t("grid-sidebar-report-description")}
        </p>
      </div>

      {!isMounted() && <Skeleton className="h-16 w-full" />}

      {!location && isMounted() && (
        <div className="space-y-4">
          <SearchLocation />

          <Sketch />
        </div>
      )}

      {location && isMounted() && (
        <Create>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full grow">
                {t("landing-key-features-grid-buttons-create-report")}
              </Button>
            </DialogTrigger>

            <DialogContent className="p-0">
              <DialogTitle className="sr-only">
                {t("landing-key-features-grid-buttons-create-report")}
              </DialogTitle>
              <ReportGenerate />
              <DialogClose />
            </DialogContent>
          </Dialog>
        </Create>
      )}
    </div>
  );
}
