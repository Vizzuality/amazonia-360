"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { LuSquareMousePointer } from "react-icons/lu";

import { AuthWrapper } from "@/containers/auth/wrapper";
import MapContainer from "@/containers/map/edit";

import { Button } from "@/components/ui/button";

export default function EditLocationReport() {
  const t = useTranslations();

  return (
    <Dialog>
      <AuthWrapper>
        <DialogTrigger asChild>
          <Button className="space-x-2" variant="outline">
            <LuSquareMousePointer className="h-5 w-5" />
            <span>{t("grid-sidebar-report-location-filters-alert-redefine-area-title")}</span>
          </Button>
        </DialogTrigger>
      </AuthWrapper>

      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid h-[calc(100%_-_theme(space.8))] w-[calc(100%_-_theme(space.8))] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-lg shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogTitle className="sr-only">
            {t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
          </DialogDescription>
          <div className="flex h-full w-full grow flex-col bg-background">
            <MapContainer desktop />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
