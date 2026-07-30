"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { useAtomValue } from "jotai";

import { useDebounce } from "@/lib/hooks";

import { tmpBboxAtom, useSyncBbox, useSyncGridSelectedDataset } from "@/app/(frontend)/store";

import GridLegend from "@/containers/map/grid-legend/grid";
import { SketchTooltips } from "@/containers/map/sketch-tooltips";
import { useSketchHandlers } from "@/containers/map/use-sketch-handlers";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";
import MapPopup from "@/components/map/popup";
import Sketch from "@/components/map/sketch";
import Tooltip from "@/components/map/tooltip";

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
  const [bbox, setBbox] = useSyncBbox();
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

        <Controls>
          <ZoomControl />
          <BasemapControl />
        </Controls>

        <MapPopup />
      </Map>

      {!gridEnabled && <Legend />}

      {gridSelectedDataset && gridEnabled && <GridLegend />}

      <div className="animate-in fade-in-0 pointer-events-none absolute top-4 left-0 z-10 w-full duration-300 lg:top-10">
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
