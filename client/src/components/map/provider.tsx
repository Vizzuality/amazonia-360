"use client";

import { ReactNode, createContext, useCallback, useContext, useState, useRef } from "react";

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
  // const [layerViews, setLayerViews] = useState<string[]>([]);

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
  // setLayerViews((prev) => {

  const onLayerViewLoaded = useCallback(
    (id: string) => {
      const l = layerViews.current.find((lv) => lv.id === id);
      if (l) {
        l.status = "success";
      }

      const { map } = mapInstance || {};

      if (map) {
        const MAP_LAYERS = map.allLayers.filter(
          (l) => !!layerViews.current.find((lv) => lv.id === l.id),
        );

        if (
          !!layerViews.current.length &&
          layerViews.current.length === MAP_LAYERS.length &&
          layerViews.current.every((lv) => lv.status !== "loading")
        ) {
          if (onLoad) onLoad(layerViews.current);
        }
      }
    },
    [mapInstance, onLoad],
  );

  const onLayerViewError = useCallback(
    (id: string) => {
      const l = layerViews.current.find((lv) => lv.id === id);
      if (l) {
        l.status = "error";
      }

      const { map } = mapInstance || {};

      if (map) {
        const MAP_LAYERS = map.allLayers.filter(
          (l) => !!layerViews.current.find((lv) => lv.id === l.id),
        );

        if (
          !!layerViews.current.length &&
          layerViews.current.length === MAP_LAYERS.length &&
          layerViews.current.every((lv) => lv.status !== "loading")
        ) {
          if (onLoad) onLoad(layerViews.current);
        }
      }
    },
    [mapInstance, onLoad],
  );

  return (
    <MapContext.Provider
      value={{
        mapInstance,
        onMapMount,
        onMapUnmount,
        onLayerViewLoading,
        onLayerViewLoaded,
        onLayerViewError,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export function useMap(): MapProps | undefined {
  const { mapInstance, onLayerViewLoading, onLayerViewLoaded, onLayerViewError } =
    useContext(MapContext);

  return {
    ...mapInstance,
    onLayerViewLoading,
    onLayerViewLoaded,
    onLayerViewError,
  };
}
