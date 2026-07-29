"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { useAtomValue } from "jotai";

import { useLocationGeometry } from "@/lib/location";

import { tmpBboxAtom, useFormLocation, useSyncGridSelectedDataset } from "@/app/(frontend)/store";

import GridLegend from "@/containers/map/grid-legend/grid";
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

export default function MapEditContainer({
  desktop,
  gridEnabled,
}: {
  desktop?: boolean;
  gridEnabled?: boolean;
}) {
  const tmpBbox = useAtomValue(tmpBboxAtom);

  const { location: defaultLocation } = useFormLocation();
  const GEOMETRY = useLocationGeometry(defaultLocation);

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
    if (GEOMETRY?.extent)
      return [
        GEOMETRY.extent.xmin,
        GEOMETRY.extent.ymin,
        GEOMETRY.extent.xmax,
        GEOMETRY.extent.ymax,
      ];

    if (desktop)
      return [-12710193.369428927, -2766739.914202488, -4682470.91080871, 1719196.4017967433];

    return [-8999366.738755312, -4376503.729887867, -4792272.701940329, 2354846.7290161047];
  }, [GEOMETRY, desktop]);

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

        <Controls className="absolute top-20 right-7">
          <ZoomControl />
          <BasemapControl />
        </Controls>

        <MapPopup />
      </Map>

      {!gridEnabled && <Legend />}

      {gridSelectedDataset && gridEnabled && <GridLegend />}
    </div>
  );
}
