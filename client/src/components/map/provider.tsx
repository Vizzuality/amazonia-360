"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
} from "react";

export type MapProps = {
  map: __esri.Map;
  view: __esri.MapView;
};

export type MapContextProps = {
  map: MapProps | undefined;
  onMapMount: (map: MapProps) => void;
  onMapUnmount: () => void;
};

export const MapContext = createContext<MapContextProps>({
  map: undefined,
  onMapMount: () => {},
  onMapUnmount: () => {},
});

export const MapProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const mapRef = useRef<MapProps>();

  const onMapMount = useCallback((map: MapProps) => (mapRef.current = map), []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = undefined;
  }, []);

  return (
    <MapContext.Provider
      value={{
        map: mapRef.current,
        onMapMount,
        onMapUnmount,
      }}
    >
      {props.children}
    </MapContext.Provider>
  );
};

export function useMap(): MapProps | undefined {
  const { map } = useContext(MapContext);

  return map;
}
