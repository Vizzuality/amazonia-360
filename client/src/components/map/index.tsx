"use client";

import { useContext, useEffect, useRef, useState } from "react";

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";
// import Extent from "@arcgis/core/geometry/Extent";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import ArcGISMap from "@arcgis/core/Map";
import ArcGISMapView from "@arcgis/core/views/MapView";
import ArcGISScaleBar from "@arcgis/core/widgets/ScaleBar";
import { merge } from "ts-deepmerge";

import { DEFAULT_MAP_VIEW_PROPERTIES } from "@/constants/map";

import { MapContext, MapProvider } from "@/components/map/provider";

export type MapProps = {
  id: string;
  defaultBbox?: number[];
  bbox?: __esri.Extent;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  mapProps?: Partial<__esri.MapProperties>;
  viewProps?: Partial<__esri.MapViewProperties>;
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
  // padding = {
  //   top: 50,
  //   right: 50,
  //   bottom: 50,
  //   left: 50,
  // },
  children,
  mapProps,
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
        basemap: "gray-vector",
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
        // padding: {
        //   top: padding?.top ?? 16,
        //   right: padding?.right ?? 16,
        //   bottom: padding?.bottom ?? 16,
        //   left: padding?.left ?? 16,
        // },
        ...mergedViewProps,
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
      const b = bbox.clone();

      // const tl = mapViewRef.current.toMap({
      //   x: 0,
      //   y: 0,
      // });
      // const br = mapViewRef.current.toMap({ x: padding.left, y: 0 });

      // const e = new Extent({
      //   xmin: tl.x,
      //   ymin: br.y,
      //   xmax: br.x,
      //   ymax: tl.y,
      //   spatialReference: mapViewRef.current.spatialReference,
      // });

      if (b.width > b.height) {
        b.offset(-b.width * 0.5, 0, 0);
        b.expand(1.5);
      }

      if (b.width <= b.height) {
        b.offset(-b.height * 0.5, 0, 0);
        b.expand(1.5);
      }

      mapViewRef.current.goTo(b, {
        duration: 1000,
        easing: "ease-in-out",
      });
    }
  }, [bbox]);

  return (
    <div ref={mapContainerRef} className="map h-full w-full grow">
      {loaded && children}
    </div>
  );
}
