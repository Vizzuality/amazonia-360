"use client";

import { useState } from "react";

import { useFormContext } from "react-hook-form";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuSquareMousePointer, LuX } from "react-icons/lu";

import {
  gridEnabledAtom,
  sketchActionAtom,
  useFormLocation,
  useSyncLocation,
} from "@/app/(frontend)/store";

import MapContainer from "@/containers/map/edit";
import { SketchTooltips } from "@/containers/map/sketch-tooltips";
import ReportGridDesktop from "@/containers/report/grid/desktop";
import Create from "@/containers/report/location/create";
import SearchLocation from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";
import { ConfirmDialog } from "@/containers/results/header/edit-location/confirm-dialog";
import EditLocationDrawingConfirm from "@/containers/results/header/edit-location/drawing-confirm";
import EditLocationDrawingTools from "@/containers/results/header/edit-location/drawing-tools";

import { Button } from "@/components/ui/button";
import { HexagonIcon } from "@/components/ui/icons/hexagon";

export default function EditLocationReport() {
  const [open, setOpen] = useState(false);
  const [gridEnabled, setGridEnabled] = useAtom(gridEnabledAtom);
  const t = useTranslations();
  const { location: defaultLocation } = useFormLocation();
  const [location, setLocation] = useSyncLocation();
  const setSketchAction = useSetAtom(sketchActionAtom);
  const form = useFormContext();

  const handleConfirm = () => {
    form.setValue("location", location);
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="space-x-2"
          variant="outline"
          onClick={() => {
            if (defaultLocation) {
              setLocation(defaultLocation);
              setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
              setOpen(true);
            }
          }}
        >
          <LuSquareMousePointer className="h-5 w-5" />
          <span>{t("grid-sidebar-report-location-filters-alert-redefine-area-title")}</span>
        </Button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
          onClick={() => setOpen(false)}
        />
        <DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] fixed top-1/2 left-1/2 z-50 grid h-[calc(100%-calc(var(--spacing)*16))] w-[calc(100%-calc(var(--spacing)*16))] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-hidden rounded-lg shadow-lg duration-200">
          <DialogTitle className="sr-only">
            {t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
          </DialogDescription>

          <DialogClose className="absolute top-6 right-6 z-10" asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              aria-label={t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
              onClick={() => setOpen(false)}
            >
              <LuX className="h-5 w-5" />
            </Button>
          </DialogClose>
          <div className="bg-background flex h-full w-full grow flex-col">
            <MapContainer desktop gridEnabled={gridEnabled} />

            <div className="absolute top-6 left-6 z-10 max-w-md">
              <div className="space-y-2">
                {!gridEnabled && (
                  <>
                    <div className="bg-background w-full rounded-lg p-6 shadow-lg">
                      {!location && (
                        <div className="space-y-4">
                          <SearchLocation />

                          <Sketch />
                        </div>
                      )}

                      {location && (
                        <Create>
                          <ConfirmDialog onConfirm={handleConfirm} />
                        </Create>
                      )}
                    </div>

                    <button
                      type="button"
                      className="group border-border pointer-events-auto flex rounded-lg border bg-white p-4 text-left shadow-lg transition-colors duration-300 hover:border-cyan-500"
                      onClick={() => setGridEnabled(true)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="bg-muted rounded-xs p-3 transition-colors duration-300 group-hover:bg-cyan-100">
                          <HexagonIcon className="text-foreground h-5 w-5 transition-colors duration-300 group-hover:text-cyan-500" />
                        </div>
                        <div className="flex flex-col items-start justify-start space-y-1">
                          <span className="text-primary group-hover:text-primary text-base font-semibold transition-colors duration-300">
                            {t("sidebar-report-grid-title")}
                          </span>
                          <span className="text-muted-foreground text-sm font-medium">
                            {t("sidebar-report-grid-description")}
                          </span>
                        </div>
                      </div>
                    </button>
                  </>
                )}

                {gridEnabled && <ReportGridDesktop />}
              </div>

              <div className="absolute top-0 left-full ml-2 min-w-96 space-y-2">
                {gridEnabled && (
                  <div className="rounded-lg bg-white px-4 py-2 shadow-lg">
                    {!location && <EditLocationDrawingTools />}
                    {location && <EditLocationDrawingConfirm onConfirm={handleConfirm} />}
                  </div>
                )}

                <SketchTooltips />
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
