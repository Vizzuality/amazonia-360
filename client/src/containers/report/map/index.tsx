"use client";

import { useCallback, useMemo, useRef } from "react";

import dynamic from "next/dynamic";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useDebounce, useWindowSize } from "rooks";

import { getGeometryWithBuffer } from "@/lib/location";

import {
  gridHoverAtom,
  sketchActionAtom,
  sketchAtom,
  tabAtom,
  tmpBboxAtom,
  useSyncBbox,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/store";

import { BUFFERS } from "@/constants/map";

import LayerManager from "@/containers/report/map/layer-manager";
import GridLegend from "@/containers/report/map/legend";
import { SketchTooltips } from "@/containers/report/map/sketch-tooltips";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";
import MapPopup from "@/components/map/popup";
import Sketch from "@/components/map/sketch";
import Tooltip from "@/components/map/tooltip";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();
  const tab = useAtomValue(tabAtom);
  const [tmpBbox, setTmpBbox] = useAtom(tmpBboxAtom);

  const [sketch, setSketch] = useAtom(sketchAtom);
  const setSketchAction = useSetAtom(sketchActionAtom);
  const sketchActionTimeoutRef = useRef<NodeJS.Timeout>();

  const setGridHover = useSetAtom(gridHoverAtom);

  const [location, setLocation] = useSyncLocation();
  const [gridSelectedDataset] = useSyncGridSelectedDataset();

  const { innerWidth } = useWindowSize();

  const padding = useMemo(() => {
    return {
      top: 50,
      right: 50,
      bottom: 50,
      left: innerWidth ? innerWidth / 2 : 0,
    };
  }, [innerWidth]);

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  const handleCreate = useCallback(
    (graphic: __esri.Graphic) => {
      setSketch({ enabled: false, type: undefined });

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
    setSketch({ enabled: false, type: undefined });
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

      setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
    },
    [location, setLocation, setTmpBbox, setSketchAction],
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

  return (
    <div className="flex w-full grow flex-col">
      <Map
        id="default"
        defaultBbox={bbox}
        bbox={tmpBbox}
        onMapMove={handleMapMove}
        onPointerLeave={handlePointerLeave}
        padding={padding}
      >
        <LayerManager />
        <Tooltip />

        <Sketch
          type={sketch.type}
          enabled={sketch.enabled}
          updatable={location?.type !== "search" && tab === "contextual-viewer"}
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

        {gridSelectedDataset && tab === "grid" && <GridLegend />}

        <MapPopup />
      </Map>

      <SketchTooltips />
    </div>
  );
}
