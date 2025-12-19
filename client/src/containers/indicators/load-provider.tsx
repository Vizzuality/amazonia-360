"use client";

import { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from "react";

import { useSetAtom } from "jotai";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import {
  pdfIndicatorsMapStateAtom,
  useSyncDefaultTopics,
  useFormTopics,
} from "@/app/(frontend)/store";

type ID = `${Indicator["id"]}-${VisualizationTypes | "custom"}`;

export type LoadContextProps = {
  onLoading: (id: ID) => void;
  onReady: (id: ID) => void;
};

export const LoadContext = createContext<LoadContextProps>({
  onLoading: () => {},
  onReady: () => {},
});

export const LoadProvider: React.FC<{
  children?: ReactNode;
  indicator?: {
    id: Indicator["id"];
    type: VisualizationTypes | "custom";
  };
  onLoad?: () => void;
}> = ({ children, indicator, onLoad }) => {
  const indicators = useRef<ID[]>([]);
  const indicatorsLoading = useRef<
    {
      id: ID;
      enabled?: boolean;
      status: "loading" | "ready";
    }[]
  >([]);
  const { topics } = useFormTopics();
  const [overviewTopics] = useSyncDefaultTopics();

  const setPdfIndicatorsMapState = useSetAtom(pdfIndicatorsMapStateAtom); // pdfIndicatorsMapStateAtom

  const onCheckLoad = useCallback(() => {
    if (indicators.current.length === 0) {
      return;
    }

    if (indicator) {
      const tis = [`${indicator.id}-${indicator.type}`];

      if (indicators.current.length === tis.length) {
        if (onLoad) {
          onLoad();
        }
      }
      return;
    }

    const tis = [
      ...(overviewTopics
        ?.map(
          (t) =>
            t.indicators?.filter((i) => i.type !== "table")?.map((i) => `${i.id}-${i.type}`) ?? [],
        )
        .flat() ?? []),
      ...(topics?.map((t) => t.indicators?.map((i) => `${i.id}-${i.type}`) ?? []).flat() ?? []),
    ];

    if (indicators.current.length === tis.length) {
      if (onLoad) {
        onLoad();
      }
    }
  }, [topics, overviewTopics, indicator, onLoad]);

  const onLoading = useCallback(
    (id: ID) => {
      if (!!indicatorsLoading.current.find((i) => i.id === id)) {
        return;
      }
      if (id.includes("map")) {
        indicatorsLoading.current.push({ id, status: "loading" });
        setPdfIndicatorsMapState((state) => [...state, { id, status: "loading" }]);
      }
    },
    [setPdfIndicatorsMapState],
  );

  const onReady = useCallback(
    (id: ID) => {
      if (indicators.current.includes(id)) {
        return;
      }
      indicators.current.push(id);

      if (id.includes("map")) {
        const il = indicatorsLoading.current.find((i) => i.id === id);
        if (il) {
          il.status = "ready";
        }
        // remove from loading
        setPdfIndicatorsMapState((state) =>
          state.map((i) => (i.id === id ? { ...i, status: "ready" } : i)),
        );
      }

      onCheckLoad();
    },
    [onCheckLoad, setPdfIndicatorsMapState],
  );

  const value = useMemo(
    () => ({
      onLoading,
      onReady,
    }),
    [onLoading, onReady],
  );

  return <LoadContext.Provider value={value}>{children}</LoadContext.Provider>;
};

export function useLoad(): LoadContextProps {
  const context = useContext(LoadContext);

  return context;
}
