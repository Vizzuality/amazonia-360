"use client";

import { useState } from "react";

import { useFormContext } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuSquareMousePointer } from "react-icons/lu";

import { sketchActionAtom, useFormLocation, useSyncLocation } from "@/app/(frontend)/store";

import { AuthWrapper } from "@/containers/auth/wrapper";
import MapContainer from "@/containers/map/edit";
import Create from "@/containers/report/location/create";
import SearchLocation from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

import { Button } from "@/components/ui/button";

export default function EditLocationReport() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();
  const { location: defaultLocation } = useFormLocation();
  const [location, setLocation] = useSyncLocation();
  const setSketchAction = useSetAtom(sketchActionAtom);
  const form = useFormContext();

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <AuthWrapper>
          <Button
            type="button"
            className="space-x-2"
            variant="outline"
            onClick={() => {
              setOpen(true);
              if (defaultLocation) {
                setLocation(defaultLocation);
                setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
              }
            }}
          >
            <LuSquareMousePointer className="h-5 w-5" />
            <span>{t("grid-sidebar-report-location-filters-alert-redefine-area-title")}</span>
          </Button>
        </AuthWrapper>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={() => setOpen(false)}
        />
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid h-[calc(100%_-_theme(space.16))] w-[calc(100%_-_theme(space.16))] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-lg shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogTitle className="sr-only">
            {t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
          </DialogDescription>
          <div className="flex h-full w-full grow flex-col bg-background">
            <MapContainer desktop />

            <div className="absolute left-6 top-6 z-10 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              {!location && (
                <div className="space-y-4">
                  <SearchLocation />

                  <Sketch />
                </div>
              )}

              {location && (
                <Create>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full grow"
                    onClick={() => {
                      form.setValue("location", location);
                      setOpen(false);
                    }}
                  >
                    {t("grid-sidebar-report-location-button-confirm")}
                  </Button>
                </Create>
              )}
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
