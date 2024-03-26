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

export type MapContainerContextProps = {
  maps: { [id: string]: MapProps };
  onMapMount: (id: string, map: MapProps) => void;
  onMapUnmount: (id: string) => void;
};

export const MapContainerContext = createContext<MapContainerContextProps>({
  maps: {},
  onMapMount: () => {},
  onMapUnmount: () => {},
});

export const MapContainerProvider: React.FC<{ children?: ReactNode }> = (
  props,
) => {
  const maps = useRef<{ [id: string]: MapProps }>({});

  const onMapMount = useCallback(
    (id: string = "default", map: MapProps) => (maps.current[id] = map),
    [],
  );

  const onMapUnmount = useCallback((id: string = "default") => {
    delete maps.current[id];
  }, []);

  return (
    <MapContainerContext.Provider
      value={{
        maps: maps.current,
        onMapMount,
        onMapUnmount,
      }}
    >
      {props.children}
    </MapContainerContext.Provider>
  );
};

export function useMap(id: string = "default"): MapProps | undefined {
  const { maps } = useContext(MapContainerContext);

  return maps[id];
}
