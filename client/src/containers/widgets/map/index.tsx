"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceFeature } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";
import { WidgetLegend } from "@/containers/widgets/map/legend";

import Controls from "@/components/map/controls";
import FullscreenControl from "@/components/map/controls/fullscreen";
import ZoomControl from "@/components/map/controls/zoom";

const Map = dynamic(() => import("@/components/map"), { ssr: false });
const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

interface WidgetMapProps extends __esri.MapViewProperties {
  indicator: Indicator;
  layers: Partial<__esri.Layer>[];
}

export default function WidgetMap({ indicator, layers, ...viewProps }: WidgetMapProps) {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  // We need to create our custom basemap and labels layers because if we use the default ones the labels will be on top of all layers, even markers
  const BASEMAP_LAYER = useMemo(() => {
    return {
      id: "basemap",
      type: "vector-tile" as const,
      url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
      style:
        "https://www.arcgis.com/sharing/rest/content/items/291da5eab3a0412593b66d384379f89f/resources/styles/root.json",
    };
  }, []);

  const LABELS_LAYER = useMemo(() => {
    return {
      id: "labels",
      type: "vector-tile" as const,
      url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
      style:
        "https://www.arcgis.com/sharing/rest/content/items/1768e8369a214dfab4e2167d5c5f2454/resources/styles/root.json",
    };
  }, []);

  return (
    <div className="relative h-full print:h-96">
      <Map
        id="overview"
        {...(GEOMETRY?.extent && {
          defaultBbox: [
            GEOMETRY?.extent.xmin,
            GEOMETRY?.extent.ymin,
            GEOMETRY?.extent.xmax,
            GEOMETRY?.extent.ymax,
          ],
          bbox: undefined,
        })}
        mapProps={{
          basemap: undefined,
        }}
        viewProps={{
          navigation: {
            mouseWheelZoomEnabled: false,
            browserTouchPanEnabled: false,
          },
          ...viewProps,
        }}
      >
        <Layer layer={BASEMAP_LAYER} index={0} />

        {layers.map((layer, index, arr) => {
          const i = arr.length - index;

          return <Layer key={layer.id} layer={layer} index={i} GEOMETRY={GEOMETRY} />;
        })}

        <SelectedLayer index={layers.length + 1} location={location} />

        <Layer layer={LABELS_LAYER} index={layers.length + 2} />

        {indicator.resource.type === "feature" && (
          <WidgetLegend
            {...(indicator as Omit<Indicator, "resource"> & {
              resource: ResourceFeature;
            })}
          />
        )}

        <Controls>
          <FullscreenControl />
          <ZoomControl />
        </Controls>
      </Map>
    </div>
  );
}
