"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { useLocale } from "next-intl";

import { useLocationGeometry } from "@/lib/location";
import { useGetOverviewTopics } from "@/lib/topics";

import {
  Indicator,
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
} from "@/app/local-api/indicators/route";
import { DefaultTopicConfig } from "@/app/parsers";
import { useSyncLocation, useSyncTopics, useSyncDefaultTopics } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";
import { WidgetLegend } from "@/containers/widgets/map/legend";

import Controls from "@/components/map/controls";
import BasemapControl, { BasemapIds } from "@/components/map/controls/basemap";
import FullscreenControl from "@/components/map/controls/fullscreen";
import ZoomControl from "@/components/map/controls/zoom";

import { handleBasemapChange } from "./utils";
import { FALLBACK_WIDGET_DEFAULT_BASEMAP_ID } from "./utils";

const Map = dynamic(() => import("@/components/map"), { ssr: false });
const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

type EsriLayer =
  | Partial<__esri.WebTileLayer>
  | Partial<__esri.ImageryTileLayer>
  | Partial<__esri.ImageryLayer>
  | Partial<__esri.FeatureLayer>;

interface WidgetMapProps extends Omit<__esri.MapViewProperties, "map"> {
  indicator: Indicator;
  basemapId?: BasemapIds;
  layers: EsriLayer[];
}

export default function WidgetMap({
  indicator,
  basemapId = FALLBACK_WIDGET_DEFAULT_BASEMAP_ID,
  layers,
  ...viewProps
}: WidgetMapProps) {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);
  const [, setTopics] = useSyncTopics();
  const [syncDefaultTopics, setSyncDefaultTopics] = useSyncDefaultTopics();
  const syncBasemapId = useMemo(() => {
    const topicWithIndicator = syncDefaultTopics?.find((topic) =>
      topic.indicators?.find((ind) => ind.id === indicator.id),
    );
    return topicWithIndicator?.indicators?.find((ind) => ind.id === indicator.id)?.basemapId;
  }, [syncDefaultTopics, indicator.id]);

  const locale = useLocale();
  const { data: overviewTopicsData } = useGetOverviewTopics({ locale });

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
    <div className="relative h-full">
      <Map
        id={`overview-${indicator.id}`}
        initialBasemapId={syncBasemapId || basemapId}
        {...(GEOMETRY?.extent && {
          defaultBbox: [
            GEOMETRY?.extent.xmin,
            GEOMETRY?.extent.ymin,
            GEOMETRY?.extent.xmax,
            GEOMETRY?.extent.ymax,
          ],
          bbox: undefined,
        })}
        viewProps={{
          navigation: {
            mouseWheelZoomEnabled: false,
            browserTouchPanEnabled: false,
          },
          ...viewProps,
        }}
      >
        {layers.map((layer: EsriLayer, index: number, arr: EsriLayer[]) => {
          const i = arr.length - index;
          // Assuming layer.id is always present for key. If not, a fallback or check might be needed.
          // For Esri Layers, 'id' is a property of __esri.Layer, which these should extend.
          return (
            <Layer
              key={layer.id || `widget-layer-${index}`}
              layer={layer}
              index={i}
              GEOMETRY={GEOMETRY}
            />
          );
        })}

        <Layer index={1} layer={DATASETS.area_afp.layer} />
        <SelectedLayer index={layers.length + 2} location={location} />
        <Layer layer={LABELS_LAYER} index={layers.length + 3} />

        {(indicator.resource.type === "feature" ||
          indicator.resource.type === "imagery" ||
          indicator.resource.type === "imagery-tile") && (
          <WidgetLegend
            {...(indicator as Omit<Indicator, "resource"> & {
              resource: ResourceFeature | ResourceImagery | ResourceImageryTile;
            })}
          />
        )}

        <Controls>
          <FullscreenControl />
          <ZoomControl />
          <BasemapControl
            onBasemapChange={(selectedBasemapId) =>
              handleBasemapChange(
                selectedBasemapId,
                overviewTopicsData ? (overviewTopicsData as unknown as DefaultTopicConfig[]) : null,
                indicator,
                setSyncDefaultTopics,
                setTopics,
                basemapId,
              )
            }
          />
        </Controls>
      </Map>
    </div>
  );
}
