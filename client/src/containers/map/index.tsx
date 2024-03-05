"use client";

import { useCallback } from "react";

import dynamic from "next/dynamic";

import { useAtom } from "jotai";
import { useDebounce } from "rooks";

import { sketchAtom, useSyncBbox } from "@/app/store";

import LayerManager from "@/containers/map/layer-manager";

import Sketch from "@/components/map/sketch";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();
  const [sketch, setSketch] = useAtom(sketchAtom);

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  const handleCreate = useCallback(() => {
    setSketch({ enabled: false, type: undefined });
  }, [setSketch]);

  const handleCancel = useCallback(() => {
    setSketch({ enabled: false, type: undefined });
  }, [setSketch]);

  return (
    <div className="w-full h-screen">
      <Map id="default" defaultBbox={bbox} onMapMove={handleMapMove}>
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
