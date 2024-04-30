"use client";

import { useContext, useEffect, useRef, useState } from "react";

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import ArcGISMap from "@arcgis/core/Map";
import ArcGISMapView from "@arcgis/core/views/MapView";
import ArcGISScaleBar from "@arcgis/core/widgets/ScaleBar";

import { DEFAULT_MAP_VIEW_PROPERTIES } from "@/constants/map";

// import { MapContainerContext } from "@/components/map/container-provider";
import { MapContext, MapProvider } from "@/components/map/provider";

export type MapProps = {
  id: string;
  defaultBbox?: number[];
  bbox?: __esri.Extent;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  viewProps?: __esri.MapViewProperties;
  children?: React.ReactNode;
  onMapMove?: (extent: __esri.Extent) => void;
};

export default function Map(mapProps: MapProps) {
  return (
    <MapProvider>
      <MapView {...mapProps} />
    </MapProvider>
  );
}

export function MapView({
  id = "default",
  defaultBbox,
  bbox,
  padding,
  children,
  viewProps,
  onMapMove,
}: MapProps) {
  const mapRef = useRef<ArcGISMap>();
  const mapViewRef = useRef<ArcGISMapView>();
  const mapContainerRef = useRef(null);

  const [loaded, setLoaded] = useState(false);

  const { onMapMount, onMapUnmount } = useContext(MapContext);

  useEffect(() => {
    if (mapContainerRef.current) {
      const baseLayer = new GraphicsLayer();
      /**
       * Initialize application
       */
      mapRef.current = new ArcGISMap({
        basemap: {
          baseLayers: [
            new VectorTileLayer({
              url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
              style:
                "https://www.arcgis.com/sharing/rest/content/items/291da5eab3a0412593b66d384379f89f/resources/styles/root.json",
            }),
            new VectorTileLayer({
              url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer",
              style:
                "https://www.arcgis.com/sharing/rest/content/items/1768e8369a214dfab4e2167d5c5f2454/resources/styles/root.json",
            }),
          ],
          referenceLayers: [],
        },
        layers: [baseLayer],
      });

      /**
       * Initialize the MapView
       */
      mapViewRef.current = new ArcGISMapView({
        map: mapRef.current, // An instance of a Map object to display in the view.
        container: mapContainerRef.current, // The id or node representing the DOM element containing the view.
        ...DEFAULT_MAP_VIEW_PROPERTIES,
        ...(defaultBbox && {
          extent: {
            xmin: defaultBbox[0],
            ymin: defaultBbox[1],
            xmax: defaultBbox[2],
            ymax: defaultBbox[3],
            spatialReference: {
              wkid: 102100,
            },
          },
        }),
        spatialReference: {
          wkid: 102100,
        },
        ui: {
          components: [],
        },
        padding: {
          top: 16,
          right: 16,
          bottom: 16,
          left: padding?.left || 16,
        },
        ...viewProps,
      });

      // Set the padding

      const scaleBar = new ArcGISScaleBar({
        view: mapViewRef.current,
        unit: "dual",
        style: "ruler",
      });

      mapViewRef.current.ui.add(scaleBar, "bottom-right");

      // check if the map is loaded
      mapViewRef.current.when(() => {
        if (!mapViewRef.current || !mapRef.current) {
          return;
        }
        onMapMount({
          map: mapRef.current,
          view: mapViewRef.current,
        });
        setLoaded(true);
      });

      // Listen to extent changes
      ArcGISReactiveUtils.when(
        () => mapViewRef.current!.extent,
        (extent) => {
          onMapMove && onMapMove(extent);
        },
      );

      return () => {
        onMapUnmount();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, onMapMount, onMapUnmount, onMapMove]);

  useEffect(() => {
    if (bbox && mapViewRef.current) {
      mapViewRef.current.goTo(bbox, {
        duration: 1000,
        easing: "ease-in-out",
      });
    }
  }, [bbox]);

  return (
    <div ref={mapContainerRef} className="map w-full h-full grow">
      {loaded && children}
    </div>
  );
}
