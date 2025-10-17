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

export type MapProps = {
  map?: __esri.Map;
  view?: __esri.MapView;
  onLayerViewLoading?: (id: string) => void;
  onLayerViewLoaded?: (id: string) => void;
  onLayerViewError?: (id: string) => void;
};

export type MapContextProps = {
  mapInstance: MapProps | undefined;
  onMapMount: (map: MapProps) => void;
  onMapUnmount: () => void;
  onLayerViewLoading: (id: string) => void;
  onLayerViewLoaded: (id: string) => void;
  onLayerViewError: (id: string) => void;
};

export type LayerViewStatus = "loading" | "success" | "error";

export type LayerView = {
  id: string;
  status: LayerViewStatus;
};

export const MapContext = createContext<MapContextProps>({
  mapInstance: undefined,
  onMapMount: () => {},
  onMapUnmount: () => {},
  onLayerViewLoading: () => {},
  onLayerViewLoaded: () => {},
  onLayerViewError: () => {},
});

export const MapProvider: React.FC<{
  children?: ReactNode;
  onLoad?: (layerViews: LayerView[]) => void;
}> = ({ children, onLoad }) => {
  const [mapInstance, setMapInstance] = useState<MapProps>();
  const layerViews = useRef<LayerView[]>([]);
  const onLoadRef = useRef(onLoad);

  // Keep onLoad ref up to date without causing rerenders
  onLoadRef.current = onLoad;

  const onMapMount = useCallback((m: MapProps) => setMapInstance(m), []);

  const onMapUnmount = useCallback(() => {
    setMapInstance(undefined);
  }, []);

  const onLayerViewLoading = useCallback((id: string) => {
    if (layerViews.current.find((lv) => lv.id === id)) {
      return;
    }
    layerViews.current.push({ id, status: "loading" });
  }, []);

  const checkLoadingComplete = useCallback((mapInstanceParam: MapProps | undefined) => {
    const { map } = mapInstanceParam || {};

    if (map) {
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
    }
  }, []);

  const onLayerViewLoaded = useCallback(
    (id: string) => {
      const l = layerViews.current.find((lv) => lv.id === id);
      if (l) {
        l.status = "success";
      }
      checkLoadingComplete(mapInstance);
    },
    [mapInstance, checkLoadingComplete],
  );

  const onLayerViewError = useCallback(
    (id: string) => {
      const l = layerViews.current.find((lv) => lv.id === id);
      if (l) {
        l.status = "error";
      }
      checkLoadingComplete(mapInstance);
    },
    [mapInstance, checkLoadingComplete],
  );

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      mapInstance,
      onMapMount,
      onMapUnmount,
      onLayerViewLoading,
      onLayerViewLoaded,
      onLayerViewError,
    }),
    [
      mapInstance,
      onMapMount,
      onMapUnmount,
      onLayerViewLoading,
      onLayerViewLoaded,
      onLayerViewError,
    ],
  );

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>;
};

export function useMap(): MapProps | undefined {
  const { mapInstance, onLayerViewLoading, onLayerViewLoaded, onLayerViewError } =
    useContext(MapContext);

  // Memoize the returned object to prevent rerenders
  return useMemo(
    () => ({
      ...mapInstance,
      onLayerViewLoading,
      onLayerViewLoaded,
      onLayerViewError,
    }),
    [mapInstance, onLayerViewLoading, onLayerViewLoaded, onLayerViewError],
  );
}
