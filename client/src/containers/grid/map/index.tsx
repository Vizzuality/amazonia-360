"use client";

import dynamic from "next/dynamic";

import { useAtom } from "jotai";
import { useDebounce } from "rooks";

import { tmpBboxAtom, useSyncBbox } from "@/app/store";

import GridLayer from "@/containers/grid/map/grid-layer";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();
  const [tmpBbox] = useAtom(tmpBboxAtom);

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  return (
    <div className="flex w-full grow flex-col">
      <Map id="default" defaultBbox={bbox} bbox={tmpBbox} onMapMove={handleMapMove}>
        <GridLayer />

        <Controls>
          <ZoomControl />
          <BasemapControl />
        </Controls>
      </Map>
    </div>
  );
}
