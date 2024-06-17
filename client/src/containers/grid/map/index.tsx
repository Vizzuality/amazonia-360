"use client";

import dynamic from "next/dynamic";

import { useAtom } from "jotai";
import { useDebounce, useWindowSize } from "rooks";

import { tmpBboxAtom, useSyncBbox } from "@/app/store";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();
  const [tmpBbox] = useAtom(tmpBboxAtom);

  const { innerWidth } = useWindowSize();

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  return (
    <div className="w-full flex flex-col grow">
      <Map
        id="default"
        defaultBbox={bbox}
        bbox={tmpBbox}
        onMapMove={handleMapMove}
        padding={{
          top: 0,
          right: 0,
          bottom: 0,
          left: innerWidth ? innerWidth / 2 : 0,
        }}
      >
        <Controls>
          <ZoomControl />
          <BasemapControl />
        </Controls>
      </Map>
    </div>
  );
}
