"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import ArcGISVectorTileLayer from "@arcgis/core/layers/VectorTileLayer";

import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import Controls from "@/components/map/controls";
import FullscreenControl from "@/components/map/controls/fullscreen";
import InfoControl from "@/components/map/controls/info";
import ZoomControl from "@/components/map/controls/zoom";
import FeatureLayer from "@/components/map/layers/feature";
import VectorTileLayer from "@/components/map/layers/vector-tile";
import WebTileLayer from "@/components/map/layers/web-tile";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

interface WidgetMapProps extends __esri.MapViewProperties {
  ids: DatasetIds[];
}

export default function WidgetMap({ ids, ...viewProps }: WidgetMapProps) {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  // We need to create our custom basemap and labels layers because if we use the default ones the labels will be on top of all layers, even markers
  const BASEMAP_LAYER = useMemo(() => {
    return new ArcGISVectorTileLayer({
      id: "basemap",
      url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
      style:
        "https://www.arcgis.com/sharing/rest/content/items/291da5eab3a0412593b66d384379f89f/resources/styles/root.json",
    });
  }, []);

  const LABELS_LAYER = useMemo(() => {
    return new ArcGISVectorTileLayer({
      id: "labels",
      url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
      style:
        "https://www.arcgis.com/sharing/rest/content/items/1768e8369a214dfab4e2167d5c5f2454/resources/styles/root.json",
    });
  }, []);

  const LAYERS = useMemo(() => {
    return ids.map((id) => {
      const l = DATASETS[id].layer;

      return l;
    });
  }, [ids]);

  return (
    <div className="relative h-full min-h-96">
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
        <VectorTileLayer layer={BASEMAP_LAYER} index={0} />

        {LAYERS.map((layer, index, arr) => {
          if (layer.type === "feature") {
            const i =
              layer.customParameters?.position === "top"
                ? arr.length + 2
                : arr.length - index;

            return (
              <FeatureLayer
                key={layer.id}
                layer={layer}
                index={i}
                GEOMETRY={GEOMETRY}
              />
            );
          }

          if (layer.type === "web-tile") {
            return (
              <WebTileLayer
                key={layer.id}
                layer={layer}
                index={arr.length - index}
              />
            );
          }
        })}
        <SelectedLayer />
        <VectorTileLayer layer={LABELS_LAYER} index={LAYERS.length + 1} />

        <Controls>
          <FullscreenControl />
          <ZoomControl />
          <InfoControl ids={ids} />
        </Controls>
      </Map>
    </div>
  );
}
