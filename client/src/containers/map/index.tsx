"use client";

import dynamic from "next/dynamic";

import { useDebounce } from "rooks";

import { useSyncBbox } from "@/app/store";

import LayerManager from "@/containers/map/layer-manager";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  return (
    <div className="w-full h-screen">
      <Map id="default" defaultBbox={bbox} onMapMove={handleMapMove}>
        <LayerManager />
      </Map>
    </div>
  );
}
