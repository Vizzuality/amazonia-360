"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";

import Image from "next/image";

import Basemap from "@arcgis/core/Basemap";
import Color from "@arcgis/core/Color";
import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";
import Extent from "@arcgis/core/geometry/Extent";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import ArcGISMap from "@arcgis/core/Map";
import ArcGISMapView from "@arcgis/core/views/MapView";
import ArcGISScaleBar from "@arcgis/core/widgets/ScaleBar";
import { merge } from "ts-deepmerge";

import { omit } from "@/lib/utils";

import { BasemapIds } from "@/constants/basemaps";
import { DEFAULT_MAP_VIEW_PROPERTIES } from "@/constants/map";

import { LayerView, MapContext, MapProvider } from "@/components/map/provider";

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
  isPdf?: boolean;
  loaded?: boolean;
  onLoad?: (layerViews: LayerView[]) => void;
};

export default function Map(mapProps: MapProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(
    (layerViews: LayerView[]) => {
      if (mapProps.onLoad) {
        mapProps.onLoad(layerViews);
        setLoaded(true);
      }
    },
    [mapProps],
  );

  return (
    <MapProvider onLoad={handleLoad}>
      <MapView {...omit(mapProps, ["onLoad"])} loaded={loaded} />
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
  isPdf = false,
  loaded = false,
}: MapProps) {
  const mapRef = useRef<ArcGISMap | null>(null);
  const mapViewRef = useRef<ArcGISMapView | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [screenshot, setScreenshot] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  const { onMapMount, onMapUnmount } = useContext(MapContext);

  useEffect(() => {
    return () => {
      if (mapViewRef.current && isPdf) {
        mapViewRef.current.destroy();
        mapViewRef.current = null;
      }
      if (mapRef.current && isPdf) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [isPdf]);

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

      if (!isPdf) mapViewRef.current.ui.add(scaleBar, scaleBarPosition);

      mapViewRef.current.on("pointer-leave", () => {
        if (onPointerLeave) onPointerLeave();
      });

      // check if the map is mounted
      mapViewRef.current.when(() => {
        if (!mapViewRef.current || !mapRef.current) {
          return;
        }
        onMapMount({
          map: mapRef.current,
          view: mapViewRef.current,
        });
        setMounted(true);
      });

      // Listen to extent changes
      ArcGISReactiveUtils.when(
        () => mapViewRef.current!.extent,
        (extent) => {
          if (onMapMove) onMapMove(extent);
        },
      );

      return () => {
        onMapUnmount();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, onMapMount, onMapUnmount, onMapMove]);

  useEffect(() => {
    ArcGISReactiveUtils.whenOnce(() => !mapViewRef.current?.updating && loaded && isPdf).then(
      () => {
        // Take a screenshot at the same resolution of the current view
        mapViewRef.current?.takeScreenshot().then(function (s) {
          if (s && s.dataUrl) {
            setScreenshot(s.dataUrl);
          }
        });
      },
    );
  }, [loaded, isPdf]);

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
    <>
      {!isPdf && (
        <div id={`map-${id}`} ref={mapContainerRef} className="map relative h-full w-full grow">
          {/* {screenshot && (
            <Image src={screenshot} alt="Map screenshot" fill className="object-cover" />
          )} */}
          {mounted && children}
        </div>
      )}

      {!screenshot && isPdf && (
        <div id={`map-${id}`} ref={mapContainerRef} className="map h-full w-full grow">
          {mounted && children}
        </div>
      )}

      {screenshot && isPdf && (
        <div className="relative h-full w-full grow">
          <Image src={screenshot} alt="Map screenshot" fill className="object-cover" />
          {mounted && children}
        </div>
      )}
    </>
  );
}
