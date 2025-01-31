"use client";

import { useCallback, useMemo } from "react";

import dynamic from "next/dynamic";

import { useAtom } from "jotai";
import { useDebounce, useWindowSize } from "rooks";

import { getGeometryWithBuffer } from "@/lib/location";

import {
  sketchAtom,
  tmpBboxAtom,
  useSyncBbox,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/store";

import LayerManager from "@/containers/report/map/layer-manager";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";
import Legend from "@/components/map/legend";
import MapPopup from "@/components/map/popup";
import Sketch from "@/components/map/sketch";
import Tooltip from "@/components/map/tooltip";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();
  const [tmpBbox, setTmpBbox] = useAtom(tmpBboxAtom);
  const [sketch, setSketch] = useAtom(sketchAtom);
  const [, setLocation] = useSyncLocation();
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
      });

      const g = getGeometryWithBuffer(graphic.geometry);
      if (g) {
        setTmpBbox(g.extent);
      }
    },
    [setTmpBbox, setSketch, setLocation],
  );

  const handleCancel = useCallback(() => {
    setSketch({ enabled: false, type: undefined });
  }, [setSketch]);

  // const handleUpdate = useCallback(
  //   (graphic: __esri.Graphic) => {
  //     // Update the location state with the updated geometry
  //     setLocation({
  //       type: graphic.geometry.type,
  //       geometry: graphic.geometry.toJSON(),
  //     });

  //     // Optionally update the bounding box based on the updated geometry
  //     const g = getGeometryWithBuffer(graphic.geometry);
  //     if (g) {
  //       setTmpBbox(g.extent);
  //     }

  //     // Log or handle other updates (e.g., update backend data)
  //     console.info("Updated graphic:", graphic);
  //   },
  //   [setLocation, setTmpBbox],
  // );

  return (
    <div className="flex w-full grow flex-col">
      <Map
        id="default"
        defaultBbox={bbox}
        bbox={tmpBbox}
        onMapMove={handleMapMove}
        padding={padding}
      >
        <LayerManager />
        <Tooltip />

        <Sketch
          type={sketch.type}
          enabled={sketch.enabled}
          onCreate={handleCreate}
          onCancel={handleCancel}
          // onUpdate={handleUpdate}
        />

        <Controls>
          <ZoomControl />
          <BasemapControl />
        </Controls>
        {gridSelectedDataset && <Legend />}
        <MapPopup />
      </Map>
    </div>
  );
}
