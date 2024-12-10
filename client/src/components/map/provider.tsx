"use client";

import { ReactNode, createContext, useCallback, useContext, useState } from "react";

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
  const [map, setMap] = useState<MapProps>();

  const onMapMount = useCallback((map: MapProps) => setMap(map), []);

  const onMapUnmount = useCallback(() => {
    setMap(undefined);
  }, []);

  return (
    <MapContext.Provider
      value={{
        map,
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
