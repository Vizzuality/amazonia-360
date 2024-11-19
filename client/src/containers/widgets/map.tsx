"use client";

import { useMemo, MouseEvent } from "react";

import dynamic from "next/dynamic";

import ArcGISVectorTileLayer from "@arcgis/core/layers/VectorTileLayer";

import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import {
  Card,
  CardControls,
  CardHeader,
  CardInfo,
  CardSettings,
  CardTitle,
} from "@/containers/card";
import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import Controls from "@/components/map/controls";
import FullscreenControl from "@/components/map/controls/fullscreen";
import InfoControl from "@/components/map/controls/info";
import ZoomControl from "@/components/map/controls/zoom";
import Layer from "@/components/map/layers";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

interface WidgetMapProps extends __esri.MapViewProperties {
  id?: string | number;
  ids: DatasetIds[];
  onEditionMode?: (e: MouseEvent<HTMLElement>) => void;
}

export default function WidgetMap({ id, ids, onEditionMode, ...viewProps }: WidgetMapProps) {
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
    <div className="relative h-full print:h-96">
      <Card className="p-0">
        <CardHeader className="p-6">
          <CardTitle>Map</CardTitle>
          <CardControls>
            <CardInfo ids={ids} />
            {!!onEditionMode && id && <CardSettings id={id as string} onClick={onEditionMode} />}
          </CardControls>
        </CardHeader>
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

            {LAYERS.map((layer, index, arr) => {
              let i = arr.length - index;

              if (layer.type === "feature") {
                i =
                  layer?.customParameters?.position === "top" ? arr.length + 3 : arr.length - index;
              }

              return <Layer key={layer.id} layer={layer} index={i} GEOMETRY={GEOMETRY} />;
            })}

            <SelectedLayer index={LAYERS.length + 1} />

            <Layer layer={LABELS_LAYER} index={LAYERS.length + 2} />

            <Controls>
              <FullscreenControl />
              <ZoomControl />
              {!onEditionMode && <InfoControl ids={ids} />}
            </Controls>
          </Map>
        </div>
      </Card>
    </div>
  );
}
