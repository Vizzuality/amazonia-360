"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import { useSyncDefaultTopics, useSyncTopics } from "@/app/store";

type ID = `${Indicator["id"]}-${VisualizationTypes | "custom"}`;

export type LoadContextProps = {
  loadingIndicators: {
    id: ID;
    enabled?: boolean;
    status: "loading" | "ready";
  }[];
  onLoading: (id: ID) => void;
  onReady: (id: ID) => void;
};

export const LoadContext = createContext<LoadContextProps>({
  loadingIndicators: [],
  onLoading: () => {},
  onReady: () => {},
});

export const LoadProvider: React.FC<{
  children?: ReactNode;
  isPdf?: boolean;
  onLoad?: () => void;
}> = ({ children, isPdf, onLoad }) => {
  const [cache, setCache] = useState<number>(0); // to force re-render
  const indicators = useRef<ID[]>([]);
  const indicatorsLoading = useRef<
    {
      id: ID;
      enabled?: boolean;
      status: "loading" | "ready";
    }[]
  >([]);
  const [topics] = useSyncTopics();
  const [overviewTopics] = useSyncDefaultTopics();

  const loadingMapIndicators = useMemo<
    {
      id: ID;
      enabled?: boolean;
      status: "loading" | "ready";
    }[]
  >(() => {
    const mis = [
      ...(overviewTopics
        ?.map(
          (t) =>
            (t.indicators
              ?.filter((i) => i.type === "map")
              ?.map((i) => `${i.id}-${i.type}`) as ID[]) ?? [],
        )
        .flat() ?? []),
      ...(topics
        ?.map(
          (t) =>
            (t.indicators
              ?.filter((i) => i.type === "map")
              ?.map((i) => `${i.id}-${i.type}`) as ID[]) ?? [],
        )
        .flat() ?? []),
    ].map((id) => {
      const i = indicatorsLoading.current.find((il) => il.id === id);

      if (i) {
        return {
          id,
          status: i.status,
          enabled: true,
        };
      }

      return {
        id,
        status: "loading" as const,
        enabled: true,
      };
    });

    if (isPdf) {
      const loadingIndicators = mis.filter((i) => i.status === "loading").slice(0, 6);

      return mis.map((i) => {
        if (loadingIndicators.find((li) => li.id === i.id)) {
          return i;
        }

        if (i.status === "ready") {
          return {
            ...i,
            enabled: true,
          };
        }

        return {
          ...i,
          enabled: false,
        };
      });
    }

    return mis;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache, topics, overviewTopics, isPdf]);

  const onCheckLoad = useCallback(() => {
    if (indicators.current.length === 0) {
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
  }, [topics, overviewTopics, onLoad]);

  const onLoading = useCallback(
    (id: ID) => {
      if (!!indicatorsLoading.current.find((i) => i.id === id)) {
        return;
      }
      indicatorsLoading.current.push({ id, status: "loading" });
    },
    [indicatorsLoading],
  );

  const onReady = useCallback(
    (id: ID) => {
      if (indicators.current.includes(id)) {
        return;
      }
      indicators.current.push(id);
      // remove from loading
      const i = indicatorsLoading.current.findIndex((i) => i.id === id)!;
      if (i !== -1) {
        indicatorsLoading.current[i].status = "ready";
      }

      if (isPdf) {
        setCache((c) => c + 1);
      }
      onCheckLoad();
    },
    [isPdf, onCheckLoad],
  );

  const value = useMemo(
    () => ({
      loadingIndicators: loadingMapIndicators,
      onLoading,
      onReady,
    }),
    [loadingMapIndicators, onLoading, onReady],
  );

  return <LoadContext.Provider value={value}>{children}</LoadContext.Provider>;
};

export function useLoad(): LoadContextProps {
  const context = useContext(LoadContext);

  return context;
}
