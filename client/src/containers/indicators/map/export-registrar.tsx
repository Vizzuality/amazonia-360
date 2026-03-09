"use client";

import { useEffect, useRef } from "react";

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";

import { useCardExport } from "@/containers/results/content/indicators/export-provider";

import { useMap } from "@/components/map/provider";

export function MapExportRegistrar() {
  const mapInstance = useMap();
  const { registerMap, unregisterMap } = useCardExport();
  const registeredElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const view = mapInstance?.view;
    if (!view) return;

    const container = view.container as HTMLElement;
    if (!container) return;

    const takeScreenshot = async (): Promise<string | null> => {
      try {
        await ArcGISReactiveUtils.whenOnce(() => !view.updating);
        const screenshot = await view.takeScreenshot();
        return screenshot?.dataUrl ?? null;
      } catch {
        return null;
      }
    };

    registeredElement.current = container;
    registerMap(container, takeScreenshot);

    return () => {
      if (registeredElement.current) {
        unregisterMap(registeredElement.current);
        registeredElement.current = null;
      }
    };
  }, [mapInstance?.view, registerMap, unregisterMap]);

  return null;
}
