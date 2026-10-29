"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useMemo,
} from "react";

import type {
  LayerViewStatus,
  SettledLayerViewStatus,
} from "@/components/map/layers/layer-view-status";

export type MapProps = {
  map?: __esri.Map;
  view?: __esri.MapView;
  onLayerViewLoading?: (id: string) => void;
  onLayerViewSettled?: (id: string, status: SettledLayerViewStatus) => void;
  onLayerViewRemoved?: (id: string) => void;
};

export type MapContextProps = {
  mapInstance: MapProps | undefined;
  onMapMount: (map: MapProps) => void;
  onMapUnmount: () => void;
  onLayerViewLoading: (id: string) => void;
  onLayerViewSettled: (id: string, status: SettledLayerViewStatus) => void;
  onLayerViewRemoved: (id: string) => void;
};

export type { LayerViewStatus };

export type LayerView = {
  id: string;
  status: LayerViewStatus;
};

export const MapContext = createContext<MapContextProps>({
  mapInstance: undefined,
  onMapMount: () => {},
  onMapUnmount: () => {},
  onLayerViewLoading: () => {},
  onLayerViewSettled: () => {},
  onLayerViewRemoved: () => {},
});

export const MapProvider: React.FC<{
  children?: ReactNode;
  onLoad?: (layerViews: LayerView[]) => void;
}> = ({ children, onLoad }) => {
  const [mapInstance, setMapInstance] = useState<MapProps>();
  const layerViews = useRef<LayerView[]>([]);
  const onLoadRef = useRef(onLoad);
  // `checkLoadingComplete` runs from ArcGIS callbacks, long after the render that
  // scheduled them. Reading the map off a ref keeps it out of the callback's
  // dependencies, so the whole context stays referentially stable.
  const mapInstanceRef = useRef<MapProps | undefined>(undefined);

  // Keep onLoad ref up to date without causing rerenders
  onLoadRef.current = onLoad;

  const onMapMount = useCallback((m: MapProps) => {
    mapInstanceRef.current = m;
    setMapInstance(m);
  }, []);

  const onMapUnmount = useCallback(() => {
    mapInstanceRef.current = undefined;
    layerViews.current = [];
    setMapInstance(undefined);
  }, []);

  const onLayerViewLoading = useCallback((id: string) => {
    if (layerViews.current.find((lv) => lv.id === id)) {
      return;
    }
    layerViews.current.push({ id, status: "loading" });
  }, []);

  const checkLoadingComplete = useCallback(() => {
    const { map } = mapInstanceRef.current || {};

    if (!map) {
      return;
    }

    const MAP_LAYERS = map.allLayers.filter(
      (l) => !!layerViews.current.find((lv) => lv.id === l.id),
    );

    if (
      !!layerViews.current.length &&
      layerViews.current.length === MAP_LAYERS.length &&
      layerViews.current.every((lv) => lv.status !== "loading")
    ) {
      if (onLoadRef.current) onLoadRef.current(layerViews.current);
    }
  }, []);

  const onLayerViewSettled = useCallback(
    (id: string, status: SettledLayerViewStatus) => {
      const l = layerViews.current.find((lv) => lv.id === id);
      if (l) {
        l.status = status;
      }
      checkLoadingComplete();
    },
    [checkLoadingComplete],
  );

  // A layer that has left the map must stop counting towards "everything loaded",
  // otherwise `layerViews` can never match `map.allLayers` again and the map is
  // stuck loading for the rest of its life.
  const onLayerViewRemoved = useCallback(
    (id: string) => {
      layerViews.current = layerViews.current.filter((lv) => lv.id !== id);
      checkLoadingComplete();
    },
    [checkLoadingComplete],
  );

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      mapInstance,
      onMapMount,
      onMapUnmount,
      onLayerViewLoading,
      onLayerViewSettled,
      onLayerViewRemoved,
    }),
    [
      mapInstance,
      onMapMount,
      onMapUnmount,
      onLayerViewLoading,
      onLayerViewSettled,
      onLayerViewRemoved,
    ],
  );

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>;
};

export function useMap(): MapProps | undefined {
  const { mapInstance, onLayerViewLoading, onLayerViewSettled, onLayerViewRemoved } =
    useContext(MapContext);

  // Memoize the returned object to prevent rerenders
  return useMemo(
    () => ({
      ...mapInstance,
      onLayerViewLoading,
      onLayerViewSettled,
      onLayerViewRemoved,
    }),
    [mapInstance, onLayerViewLoading, onLayerViewSettled, onLayerViewRemoved],
  );
}
