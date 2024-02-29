"use client";

import { useContext, useEffect, useRef, useState } from "react";

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";
import ArcGISExtent from "@arcgis/core/geometry/Extent";
import * as ArcGISprojection from "@arcgis/core/geometry/projection";
import ArcGISMap from "@arcgis/core/Map";
import ArcGISMapView from "@arcgis/core/views/MapView";

import { DEFAULT_MAP_VIEW_PROPERTIES } from "@/constants/map";

import { MapContext } from "@/components/map/provider";

export type MapProps = {
  id: string;
  defaultBbox?: number[];
  children?: React.ReactNode;
  onMapMove?: (extent: __esri.Extent) => void;
};

export default function Map({
  id = "default",
  defaultBbox,
  children,
  onMapMove,
}: MapProps) {
  const mapRef = useRef<ArcGISMap>();
  const mapViewRef = useRef<ArcGISMapView>();
  const mapContainerRef = useRef(null);

  const [loaded, setLoaded] = useState(false);

  const { onMapMount, onMapUnmount } = useContext(MapContext);

  useEffect(() => {
    if (mapContainerRef.current) {
      /**
       * Initialize application
       */
      mapRef.current = new ArcGISMap({
        basemap: "gray-vector",
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
              wkid: 4326,
            },
          },
        }),
      });

      // check if the map is loaded
      mapViewRef.current.when(() => {
        if (!mapViewRef.current || !mapRef.current) {
          return;
        }
        onMapMount(id, {
          map: mapRef.current,
          view: mapViewRef.current,
        });
        setLoaded(true);

        // Remove the default widgets
        mapViewRef.current.ui.empty("top-left");
      });

      // Listen to extent changes
      ArcGISReactiveUtils.when(
        () => mapViewRef.current!.extent,
        (extent) => {
          const pExtent = ArcGISprojection.project(extent, {
            wkid: 4326,
          }) as ArcGISExtent;

          onMapMove && onMapMove(pExtent);
        },
      );

      return () => {
        onMapUnmount(id);
        mapViewRef.current!.destroy();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, onMapMount, onMapUnmount, onMapMove]);

  return (
    <div ref={mapContainerRef} className="w-full h-full">
      {loaded && children}
    </div>
  );
}
