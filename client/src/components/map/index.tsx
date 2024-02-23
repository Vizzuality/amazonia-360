"use client";

import { useContext, useEffect, useRef, useState } from "react";

import ArcGISMap from "@arcgis/core/Map";
import ArcGISMapView from "@arcgis/core/views/MapView";

import { DEFAULT_MAP_VIEW_PROPERTIES } from "@/constants/map";

import { MapContext } from "@/components/map/provider";

export type MapProps = {
  id: string;
  children?: React.ReactNode;
};

export default function Map({ id = "default", children }: MapProps) {
  const mapRef = useRef<ArcGISMap>();
  const mapViewRef = useRef<ArcGISMapView>();
  const mapContainerRef = useRef(null);

  const [test, setTest] = useState(0);

  const { onMapMount, onMapUnmount } = useContext(MapContext);

  useEffect(() => {
    if (mapContainerRef.current) {
      /**
       * Initialize application
       */
      mapRef.current = new ArcGISMap({
        basemap: "gray-vector", // Basemap layer service to use for the map.
      });

      mapViewRef.current = new ArcGISMapView({
        map: mapRef.current, // An instance of a Map object to display in the view.
        container: mapContainerRef.current, // The id or node representing the DOM element containing the view.
        ...DEFAULT_MAP_VIEW_PROPERTIES,
      });

      onMapMount(id, {
        map: mapRef.current,
        view: mapViewRef.current,
      });

      // Remove the default widgets
      mapViewRef.current.ui.empty("top-left");

      return () => {
        onMapUnmount(id);
        mapViewRef.current && mapViewRef.current.destroy();
      };
    }
  }, [id, onMapMount, onMapUnmount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTest((prev) => prev + 0.05);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [test]);

  return (
    <div ref={mapContainerRef} className="w-full h-full">
      {children}
    </div>
  );
}
