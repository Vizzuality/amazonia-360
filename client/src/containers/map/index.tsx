"use client";

import { useCallback, useMemo, useState } from "react";

import dynamic from "next/dynamic";

import { useAtomValue } from "jotai";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { useDebounce } from "@/lib/hooks";

import { tmpBboxAtom, useSyncBbox, useSyncGridSelectedDataset } from "@/app/(frontend)/store";

import GridLegend from "@/containers/map/grid-legend/grid";
import LayerStatus from "@/containers/map/layer-status";
import { SketchTooltips } from "@/containers/map/sketch-tooltips";
import { useSketchHandlers } from "@/containers/map/use-sketch-handlers";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";
import MapPopup from "@/components/map/popup";
import Sketch from "@/components/map/sketch";
import Tooltip from "@/components/map/tooltip";
import { Button } from "@/components/ui/button";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

const LayerManager = dynamic(() => import("./layer-manager"), {
  ssr: false,
});

const Legend = dynamic(() => import("./legend"), {
  ssr: false,
});

export default function MapContainer({
  desktop,
  gridEnabled,
}: {
  desktop?: boolean;
  gridEnabled?: boolean;
}) {
  const t = useTranslations();
  const [bbox, setBbox] = useSyncBbox();

  const [mapAttempt, setMapAttempt] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);

  const handleMapError = useCallback(() => setMapFailed(true), []);
  const handleMapRetry = useCallback(() => {
    setMapFailed(false);
    setMapAttempt((a) => a + 1);
  }, []);
  const tmpBbox = useAtomValue(tmpBboxAtom);

  const [gridSelectedDataset] = useSyncGridSelectedDataset();

  const {
    sketch,
    sketchAction,
    location,
    handleCreate,
    handleCreateChange,
    handleCancel,
    handleUpdate,
    handleUpdateChange,
    handlePointerLeave,
  } = useSketchHandlers();

  const defaultBbox = useMemo(() => {
    if (bbox) return bbox;

    if (desktop)
      return [-12710193.369428927, -2766739.914202488, -4682470.91080871, 1719196.4017967433];

    return [-8999366.738755312, -4376503.729887867, -4792272.701940329, 2354846.7290161047];
  }, [bbox, desktop]);

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  return (
    <div className="relative flex w-full grow flex-col">
      <Map
        key={mapAttempt}
        id="default"
        defaultBbox={defaultBbox}
        bbox={tmpBbox}
        padding={desktop}
        viewProps={{
          popup: {
            dockEnabled: false,

            visibleElements: {
              actionBar: false,
              collapseButton: false,
              featureListLayerTitle: false,
            },

            viewModel: {
              includeDefaultActions: false,
            },
            features: [],
          },
        }}
        onMapMove={handleMapMove}
        onPointerLeave={handlePointerLeave}
        onError={handleMapError}
      >
        <LayerManager gridEnabled={gridEnabled} />
        <Tooltip />

        <Sketch
          type={sketch.type}
          enabled={sketch.enabled}
          updatable={location?.type !== "search" && !gridEnabled}
          completed={sketchAction.type === "create" && sketchAction.state === "complete"}
          location={location}
          onCreate={handleCreate}
          onCreateChange={handleCreateChange}
          onCancel={handleCancel}
          onUpdate={handleUpdate}
          onUpdateChange={handleUpdateChange}
        />

        <Controls className="absolute top-4 right-4 lg:top-[calc(1rem+var(--country-module-strip-h,0px))]">
          <ZoomControl />
          <BasemapControl />
        </Controls>

        <MapPopup />

        <LayerStatus className="absolute top-4 right-16 z-10 max-w-[calc(100%-5rem)] lg:top-[calc(1rem+var(--country-module-strip-h,0px))]" />
      </Map>

      {mapFailed && (
        <div
          data-testid="map-unavailable"
          role="alert"
          className="bg-background absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-4 text-center"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <TriangleAlert className="text-destructive h-5 w-5" aria-hidden />
          </div>
          <div className="max-w-80 space-y-1">
            <p className="text-destructive text-sm font-bold">{t("map-state-error-title")}</p>
            <p className="text-muted-foreground text-sm">{t("map-state-error-description")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="space-x-2"
            onClick={handleMapRetry}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            <span>{t("card-state-retry")}</span>
          </Button>
        </div>
      )}

      {!gridEnabled && <Legend />}

      {gridSelectedDataset && gridEnabled && <GridLegend />}

      <div className="animate-in fade-in-0 pointer-events-none absolute top-4 left-0 z-10 w-full duration-300 lg:top-[calc(2.5rem+var(--country-module-strip-h,0px))]">
        <div className="container">
          <div className="grid grid-cols-12">
            <div className="col-span-10 lg:col-span-5 lg:col-start-8">
              <div className="-mx-1 flex lg:mx-0 lg:justify-center lg:text-center">
                <SketchTooltips />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
