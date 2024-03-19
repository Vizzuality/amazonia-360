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
  maps: { [id: string]: MapProps };
  onMapMount: (id: string, map: MapProps) => void;
  onMapUnmount: (id: string) => void;
};

export const MapContext = createContext<MapContextProps>({
  maps: {},
  onMapMount: () => {},
  onMapUnmount: () => {},
});

export const MapProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const maps = useRef<{ [id: string]: MapProps }>({});

  const onMapMount = useCallback(
    (id: string = "default", map: MapProps) => (maps.current[id] = map),
    [],
  );

  const onMapUnmount = useCallback((id: string = "default") => {
    delete maps.current[id];
  }, []);

  return (
    <MapContext.Provider
      value={{
        maps: maps.current,
        onMapMount,
        onMapUnmount,
      }}
    >
      {props.children}
    </MapContext.Provider>
  );
};

export function useMap(id: string = "default"): MapProps | undefined {
  const { maps } = useContext(MapContext);

  return maps[id];
}
