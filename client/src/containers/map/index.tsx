"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import dynamic from "next/dynamic";

import { useAtom, useSetAtom } from "jotai";

import { useDebounce } from "@/lib/hooks";
import { getGeometryWithBuffer } from "@/lib/location";

import {
  gridHoverAtom,
  sketchActionAtom,
  sketchAtom,
  tmpBboxAtom,
  useSyncBbox,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/(frontend)/store";

import { BUFFERS } from "@/constants/map";

import GridLegend from "@/containers/map/grid-legend/grid";
import { SketchTooltips } from "@/containers/map/sketch-tooltips";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";
import MapPopup from "@/components/map/popup";
import Sketch from "@/components/map/sketch";
import Tooltip from "@/components/map/tooltip";

import { usePathname } from "@/i18n/navigation";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

const LayerManager = dynamic(() => import("./layer-manager"), {
  ssr: false,
});

const Legend = dynamic(() => import("./legend"), {
  ssr: false,
});

export default function MapContainer({ desktop }: { desktop?: boolean }) {
  const pathname = usePathname();

  const [bbox, setBbox] = useSyncBbox();
  const [tmpBbox, setTmpBbox] = useAtom(tmpBboxAtom);

  const [sketch, setSketch] = useAtom(sketchAtom);
  const [sketchAction, setSketchAction] = useAtom(sketchActionAtom);
  const sketchActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setGridHover = useSetAtom(gridHoverAtom);
  const [location, setLocation] = useSyncLocation();
  const [gridSelectedDataset] = useSyncGridSelectedDataset();

  const defaultBbox = useMemo(() => {
    if (bbox) return bbox;

    if (desktop)
      return [-12710193.369428927, -2766739.914202488, -4682470.91080871, 1719196.4017967433];

    return [-8999366.738755312, -4376503.729887867, -4792272.701940329, 2354846.7290161047];
  }, [bbox, desktop]);

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  const handleCreate = useCallback(
    (graphic: __esri.Graphic) => {
      setSketch({ enabled: undefined, type: undefined });

      setLocation({
        type: graphic.geometry.type,
        geometry: graphic.geometry.toJSON(),
        buffer: BUFFERS[graphic.geometry.type],
      });

      const g = getGeometryWithBuffer(graphic.geometry, BUFFERS[graphic.geometry.type]);
      if (g) {
        setTmpBbox(g.extent);
      }

      sketchActionTimeoutRef.current = setTimeout(() => {
        setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
      }, 5000);
    },
    [setTmpBbox, setSketch, setLocation, setSketchAction],
  );

  const handleCreateChange = useCallback(
    (e: __esri.SketchViewModelCreateEvent) => {
      if (sketchActionTimeoutRef.current) {
        clearTimeout(sketchActionTimeoutRef.current);
      }
      setSketchAction({ type: "create", state: e.state, geometryType: sketch.type });
    },
    [setSketchAction, sketch.type],
  );

  const handleCancel = useCallback(() => {
    setSketch({ enabled: undefined, type: undefined });
    setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
  }, [setSketch, setSketchAction]);

  const handleUpdate = useCallback(
    (graphic: __esri.Graphic) => {
      if (!location) return;
      const b = location.type !== "search" ? location.buffer : BUFFERS[graphic.geometry.type];
      // Update the location state with the updated geometry
      setLocation({
        type: graphic.geometry.type,
        geometry: graphic.geometry.toJSON(),
        buffer: b,
      });

      // Optionally update the bounding box based on the updated geometry
      const g = getGeometryWithBuffer(graphic.geometry, b);
      if (g) {
        setTmpBbox(g.extent);
      }

      setSketch({ enabled: undefined, type: undefined });
      setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
    },
    [location, setLocation, setTmpBbox, setSketch, setSketchAction],
  );

  const handleUpdateChange = useCallback(
    (e: __esri.SketchViewModelUpdateEvent) => {
      if (sketchActionTimeoutRef.current) {
        clearTimeout(sketchActionTimeoutRef.current);
      }
      setSketchAction({
        type: "update",
        state: e.state,
        geometryType: e.graphics[0].geometry.type,
      });
    },
    [setSketchAction],
  );

  const handlePointerLeave = useCallback(() => {
    setGridHover({
      id: null,
      cell: undefined,
      index: undefined,
      values: [],
      x: null,
      y: null,
      coordinates: undefined,
    });
  }, [setGridHover]);

  useEffect(() => {
    if (sketch.enabled === "edit") {
      // focus map
      const mapElement = document.querySelector("#map-default .esri-view-surface") as HTMLElement;

      if (mapElement) {
        mapElement.focus();
      }
    }
  }, [sketch.enabled]);

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
        <LayerManager />
        <Tooltip />

        <Sketch
          type={sketch.type}
          enabled={sketch.enabled}
          updatable={location?.type !== "search" && !pathname.includes("/grid")}
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

      {!pathname.includes("/grid") && <Legend />}

      {gridSelectedDataset && pathname.includes("/grid") && <GridLegend />}

      <SketchTooltips />
    </div>
  );
}
