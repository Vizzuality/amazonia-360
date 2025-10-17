"use client";

import { ReactNode, createContext, useCallback, useContext, useRef } from "react";

export type IndicatorProps = {
  onIndicatorViewLoading?: (id: string | number) => void;
  onIndicatorViewLoaded?: (id: string | number) => void;
  onIndicatorViewError?: (id: string | number) => void;
};

export type IndicatorContextProps = {
  onIndicatorViewLoading: (id: string | number) => void;
  onIndicatorViewLoaded: (id: string | number) => void;
  onIndicatorViewError: (id: string | number) => void;
};

export type IndicatorViewStatus = "loading" | "success" | "error";

export type IndicatorView = {
  id: string | number;
  status: IndicatorViewStatus;
};

export const IndicatorContext = createContext<IndicatorContextProps>({
  onIndicatorViewLoading: () => {},
  onIndicatorViewLoaded: () => {},
  onIndicatorViewError: () => {},
});

export const IndicatorProvider: React.FC<{
  children?: ReactNode;
  onLoad?: (indicatorViews: IndicatorView[]) => void;
}> = ({ children, onLoad }) => {
  const indicatorViews = useRef<IndicatorView[]>([]);

  const onIndicatorViewLoading = useCallback((id: string | number) => {
    if (indicatorViews.current.find((lv) => lv.id === id)) {
      return;
    }
    indicatorViews.current.push({ id, status: "loading" });
  }, []);

  const onIndicatorViewLoaded = useCallback(
    (id: string | number) => {
      const l = indicatorViews.current.find((lv) => lv.id === id);
      if (l) {
        l.status = "success";
      }

      if (
        !!indicatorViews.current.length &&
        indicatorViews.current.every((lv) => lv.status !== "loading")
      ) {
        if (onLoad) onLoad(indicatorViews.current);
      }
    },
    [onLoad],
  );

  const onIndicatorViewError = useCallback(
    (id: string | number) => {
      const l = indicatorViews.current.find((lv) => lv.id === id);
      if (l) {
        l.status = "error";
      }

      if (
        !!indicatorViews.current.length &&
        indicatorViews.current.every((lv) => lv.status !== "loading")
      ) {
        if (onLoad) onLoad(indicatorViews.current);
      }
    },
    [onLoad],
  );

  return (
    <IndicatorContext.Provider
      value={{
        onIndicatorViewLoading,
        onIndicatorViewLoaded,
        onIndicatorViewError,
      }}
    >
      {children}
    </IndicatorContext.Provider>
  );
};

export function useIndicator(): IndicatorContextProps {
  const context = useContext(IndicatorContext);

  return context;
}
