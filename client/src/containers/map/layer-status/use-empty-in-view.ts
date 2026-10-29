"use client";

import { useEffect, useState } from "react";

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";

import { useMap } from "@/components/map/provider";

/**
 * Whether a drawn feature layer shows nothing in the current view, rechecked each time the map
 * comes to rest. The count runs on the features already in the browser, so panning costs no
 * request. A suspended layer (hidden, out of scale) is never reported as empty.
 */
export const useEmptyInView = (layerId: string | undefined, enabled: boolean) => {
  const mapInstance = useMap();
  const view = mapInstance?.view;
  const map = mapInstance?.map;

  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (!enabled || !view || !map || !layerId) return;

    const layer = map.findLayerById(layerId);
    if (!layer || layer.type !== "feature") return;

    const controller = new AbortController();
    let handle: ReturnType<typeof ArcGISReactiveUtils.when> | undefined;

    view
      .whenLayerView(layer)
      .then((layerView) => {
        if (controller.signal.aborted) return;

        const featureLayerView = layerView as __esri.FeatureLayerView;

        handle = ArcGISReactiveUtils.when(
          () => view.stationary && !featureLayerView.updating,
          async () => {
            if (featureLayerView.suspended) {
              setEmpty(false);
              return;
            }

            try {
              const count = await featureLayerView.queryFeatureCount(undefined, {
                signal: controller.signal,
              });
              setEmpty(count === 0);
            } catch {
              // Aborted, or the view moved on; the next rest checks again.
            }
          },
          { initial: true },
        );
      })
      .catch(() => {
        // The layer failed to draw; its status already says so.
      });

    return () => {
      controller.abort();
      handle?.remove();
    };
  }, [enabled, view, map, layerId]);

  return enabled && empty;
};
