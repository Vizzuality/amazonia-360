"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { useLocationGeometry } from "@/lib/location";

import { Report } from "@/payload-types";

const Map = dynamic(() => import("@/components/map"), { ssr: false });
const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });
const SelectedLayer = dynamic(
  () => import("@/containers/report/map/layer-manager/selected-layer"),
  { ssr: false },
);

export default function ReportMapPreview({ id, location }: Report) {
  const GEOMETRY = useLocationGeometry(location);

  const LABELS_LAYER = useMemo(() => {
    return {
      id: "labels",
      type: "vector-tile" as const,
      url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
      style:
        "https://www.arcgis.com/sharing/rest/content/items/1768e8369a214dfab4e2167d5c5f2454/resources/styles/root.json",
    };
  }, []);

  if (!GEOMETRY) return null;

  return (
    <div className="h-full w-full">
      <Map
        id={`report-preview-${id}`}
        initialBasemapId="gray-vector"
        {...(GEOMETRY?.extent && {
          defaultBbox: [
            GEOMETRY.extent.xmin,
            GEOMETRY.extent.ymin,
            GEOMETRY.extent.xmax,
            GEOMETRY.extent.ymax,
          ],
        })}
        viewProps={{
          navigation: {
            mouseWheelZoomEnabled: false,
            browserTouchPanEnabled: false,
          },
          ui: {
            components: [],
          },
        }}
        isPdf
      >
        <SelectedLayer index={2} location={location} />
        <Layer layer={LABELS_LAYER} index={3} />
      </Map>
    </div>
  );
}
