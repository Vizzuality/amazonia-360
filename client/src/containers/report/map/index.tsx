"use client";

import { useCallback, useMemo } from "react";

import dynamic from "next/dynamic";

import { useAtom } from "jotai";
import { useDebounce, useWindowSize } from "rooks";

import { getGeometryWithBuffer } from "@/lib/location";

import { sketchAtom, tmpBboxAtom, useSyncBbox, useSyncLocation } from "@/app/store";

import LayerManager from "@/containers/report/map/layer-manager";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";
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
        />

        <Controls>
          <ZoomControl />
          <BasemapControl />
        </Controls>
      </Map>
    </div>
  );
}
