"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import Controls from "@/components/map/controls";
import FullscreenControl from "@/components/map/controls/fullscreen";
import InfoControl from "@/components/map/controls/info";
import ZoomControl from "@/components/map/controls/zoom";
import FeatureLayer from "@/components/map/layers/feature";
import WebTileLayer from "@/components/map/layers/web-tile";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

interface WidgetMapProps extends __esri.MapViewProperties {
  ids: DatasetIds[];
}

export default function WidgetMap({ ids, ...viewProps }: WidgetMapProps) {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

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
        viewProps={{
          navigation: {
            mouseWheelZoomEnabled: false,
            browserTouchPanEnabled: false,
          },
          ...viewProps,
        }}
      >
        {LAYERS.map((layer, index, arr) => {
          if (layer.type === "feature") {
            return (
              <FeatureLayer
                key={layer.id}
                layer={layer}
                index={arr.length - index}
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

        <Controls>
          <FullscreenControl />
          <ZoomControl />
          <InfoControl ids={ids} />
        </Controls>
      </Map>
    </div>
  );
}
