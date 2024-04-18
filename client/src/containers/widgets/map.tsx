"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";

import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import { Card } from "@/containers/card";
import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import Controls from "@/components/map/controls";
import FullscreenControl from "@/components/map/controls/fullscreen";
import ZoomControl from "@/components/map/controls/zoom";
import FeatureLayer from "@/components/map/layers/feature";
import WebTileLayer from "@/components/map/layers/web-tile";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

interface WidgetMapProps {
  ids: DatasetIds[];
}

export default function WidgetMap({ ids }: WidgetMapProps) {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const LAYERS = useMemo(() => {
    return ids.map((id) => {
      const l = DATASETS[id].layer;

      if (GEOMETRY && l.type === "feature" && !l.featureReduction) {
        l.featureEffect = new FeatureEffect({
          filter: {
            geometry: GEOMETRY,
          },
          excludedEffect: "opacity(0%)",
        });
      }

      return l;
    });
  }, [ids, GEOMETRY]);

  return (
    <Card className="h-full min-h-96 p-0 relative">
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
        }}
      >
        {LAYERS.map((layer, index, arr) => {
          if (layer.type === "feature") {
            return (
              <FeatureLayer
                key={layer.id}
                layer={layer}
                index={arr.length - index}
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
        </Controls>
      </Map>
    </Card>
  );
}
