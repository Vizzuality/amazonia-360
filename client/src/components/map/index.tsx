"use client";

import { useContext, useEffect, useRef, useState } from "react";

import Basemap from "@arcgis/core/Basemap";
import Color from "@arcgis/core/Color";
import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";
import Extent from "@arcgis/core/geometry/Extent";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import ArcGISMap from "@arcgis/core/Map";
import ArcGISMapView from "@arcgis/core/views/MapView";
import ArcGISScaleBar from "@arcgis/core/widgets/ScaleBar";
import { merge } from "ts-deepmerge";

import { DEFAULT_MAP_VIEW_PROPERTIES } from "@/constants/map";

import { BasemapIds } from "@/components/map/controls/basemap";
import { MapContext, MapProvider } from "@/components/map/provider";

export type MapProps = {
  id: string;
  defaultBbox?: number[];
  bbox?: __esri.Extent;
  padding?: boolean;
  mapProps?: Partial<__esri.MapProperties>;
  viewProps?: Partial<__esri.MapViewProperties>;
  children?: React.ReactNode;
  onHover?: () => void;
  onMapMove?: (extent: __esri.Extent) => void;
  onPointerLeave?: () => void;
  initialBasemapId?: BasemapIds;
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
  children,
  padding,
  mapProps,
  viewProps,
  onMapMove,
  onPointerLeave,
  initialBasemapId,
}: MapProps) {
  const mapRef = useRef<ArcGISMap>();
  const mapViewRef = useRef<ArcGISMapView>();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [loaded, setLoaded] = useState(false);

  const { onMapMount, onMapUnmount } = useContext(MapContext);

  useEffect(() => {
    if (mapContainerRef.current) {
      const baseLayer = new GraphicsLayer();
      /**
       * Initialize application
       */
      mapRef.current = new ArcGISMap({
        basemap: initialBasemapId ? Basemap.fromId(initialBasemapId) : "gray-vector",
        layers: [baseLayer],
        ...mapProps,
      });

      const mergedViewProps = merge(
        DEFAULT_MAP_VIEW_PROPERTIES as unknown as Record<string, unknown>,
        (viewProps || {}) as unknown as Record<string, unknown>,
      );

      /**
       * Initialize the MapView
       */
      mapViewRef.current = new ArcGISMapView({
        map: mapRef.current, // An instance of a Map object to display in the view.
        container: mapContainerRef.current, // The id or node representing the DOM element containing the view.
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
        highlightOptions: {
          color: new Color("#009AFF"),
          haloOpacity: 0.9,
          fillOpacity: 0.2,
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
        ...mergedViewProps,
      });

      // Set the padding

      const scaleBar = new ArcGISScaleBar({
        view: mapViewRef.current,
        unit: "dual",
        style: "ruler",
      });
      const mapWidth = mapContainerRef.current.offsetWidth;
      const scaleBarPosition = mapWidth >= 1024 ? "bottom-right" : "top-left";
      mapViewRef.current.ui.add(scaleBar, scaleBarPosition);

      mapViewRef.current.on("pointer-leave", () => {
        if (onPointerLeave) onPointerLeave();
      });

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
      const b = bbox.clone();

      const xmin = padding ? b.xmin - (b.xmax - b.xmin) : b.xmin;
      const ymin = b.ymin;
      const xmax = b.xmax;
      const ymax = b.ymax;

      const e = new Extent({
        xmin,
        ymin,
        xmax,
        ymax,
        spatialReference: mapViewRef.current.spatialReference,
      });

      if (mapViewRef?.current.isFulfilled()) {
        mapViewRef?.current?.goTo(e, {
          duration: 1000,
          easing: "ease-in-out",
        });
      }
    }
  }, [bbox, padding]);

  return (
    <div id={`map-${id}`} ref={mapContainerRef} className="map h-full w-full grow">
      {loaded && children}
    </div>
  );
}
