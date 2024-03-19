"use client";

import { useCallback } from "react";

import dynamic from "next/dynamic";

import { useAtom } from "jotai";
import { useDebounce } from "rooks";

import {
  sketchAtom,
  tmpBboxAtom,
  useSyncBbox,
  useSyncLocation,
} from "@/app/store";

import LayerManager from "@/containers/report/map/layer-manager";

import Sketch from "@/components/map/sketch";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();
  const [tmpBbox, setTmpBbox] = useAtom(tmpBboxAtom);
  const [sketch, setSketch] = useAtom(sketchAtom);
  const [, setLocation] = useSyncLocation();

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
      setTmpBbox(graphic.geometry.extent);
    },
    [setTmpBbox, setSketch, setLocation],
  );

  const handleCancel = useCallback(() => {
    setSketch({ enabled: false, type: undefined });
  }, [setSketch]);

  return (
    <div className="w-full grow">
      <Map
        id="default"
        defaultBbox={bbox}
        bbox={tmpBbox}
        onMapMove={handleMapMove}
      >
        <LayerManager />

        <Sketch
          type={sketch.type}
          enabled={sketch.enabled}
          onCreate={handleCreate}
          onCancel={handleCancel}
        />
      </Map>
    </div>
  );
}
