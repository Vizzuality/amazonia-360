import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
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
  const [maps, setMaps] = useState<{ [id: string]: MapProps }>({});

  const onMapMount = useCallback(
    (id: string = "default", map: MapProps) =>
      setMaps((prev) => {
        if (id === "current") {
          throw new Error("'current' cannot be used as map id");
        }
        if (prev[id]) {
          throw new Error(`Multiple maps with the same id: ${id}`);
        }
        return { ...prev, [id]: map };
      }),
    [],
  );

  const onMapUnmount = useCallback((id: string = "default") => {
    setMaps((prev) => {
      if (prev[id]) {
        const nextMaps = { ...prev };
        delete nextMaps[id];
        return nextMaps;
      }
      return prev;
    });
  }, []);

  return (
    <MapContext.Provider
      value={{
        maps,
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
