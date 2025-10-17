"use client";

import { ReactNode, createContext, useCallback, useContext, useRef } from "react";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import { useSyncDefaultTopics, useSyncTopics } from "@/app/store";

type ID = `${Indicator["id"]}-${VisualizationTypes | "custom"}`;

export type LoadContextProps = {
  onReady: (id: ID) => void;
};

export const LoadContext = createContext<LoadContextProps>({
  onReady: () => {},
});

export const LoadProvider: React.FC<{
  children?: ReactNode;
  onLoad?: () => void;
}> = ({ children, onLoad }) => {
  const indicators = useRef<ID[]>([]);
  const [topics] = useSyncTopics();
  const [overviewTopics] = useSyncDefaultTopics();

  const onCheckLoad = useCallback(() => {
    if (indicators.current.length === 0) {
      return;
    }

    const tis = [
      ...(topics?.map((t) => t.indicators?.map((i) => `${i.id}-${i.type}`) ?? []).flat() ?? []),
      ...(overviewTopics
        ?.map(
          (t) =>
            t.indicators?.filter((i) => i.type !== "table")?.map((i) => `${i.id}-${i.type}`) ?? [],
        )
        .flat() ?? []),
    ];

    if (indicators.current.length === tis.length) {
      if (onLoad) {
        onLoad();
      }
    }
  }, [topics, overviewTopics, onLoad]);

  const onReady = useCallback(
    (id: ID) => {
      if (indicators.current.includes(id)) {
        return;
      }
      indicators.current.push(id);

      onCheckLoad();
    },
    [onCheckLoad],
  );

  return (
    <LoadContext.Provider
      value={{
        onReady,
      }}
    >
      {children}
    </LoadContext.Provider>
  );
};

export function useLoad(): LoadContextProps {
  const context = useContext(LoadContext);

  return context;
}
