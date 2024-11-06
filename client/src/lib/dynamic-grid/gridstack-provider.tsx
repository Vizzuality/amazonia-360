// gridstack-context.tsx
"use client";

import * as React from "react";

import type { GridStack } from "gridstack";

import "gridstack/dist/gridstack-extra.css";
import "gridstack/dist/gridstack.css";
import type { ItemRefType } from "./gridstack-item";

type GridStackContextType = {
  grids: Record<string, GridStack | null> | null;
  setGrids: React.Dispatch<React.SetStateAction<Record<string, GridStack | null> | null>>;
  addItemRefToList: (id: string, gridId: string, ref: ItemRefType) => void;
  removeItemRefFromList: (id: string, gridId: string) => void;
  itemRefList: Record<string, ItemRefListType>;
  getItemRefFromListById: (id: string, gridId: string) => ItemRefType | null;
};

type ItemRefListType = {
  id: string;
  ref: ItemRefType;
}[];

export const GridstackContext = React.createContext<GridStackContextType | null>(null);

export const GridstackProvider = ({ children }: { children: React.ReactNode }) => {
  const [grids, setGrids] = React.useState<Record<string, GridStack | null> | null>(null);
  const [itemRefList, setItemRefList] = React.useState<Record<string, ItemRefListType>>({});

  const addItemRefToList = React.useCallback((id: string, gridId: string, ref: ItemRefType) => {
    setItemRefList((prev) => ({
      ...prev,
      [gridId]: [...(prev[gridId] ?? []), { id, ref }],
    }));
  }, []);

  const removeItemRefFromList = React.useCallback((id: string, gridId: string) => {
    setItemRefList((prev) => ({
      ...prev,
      [gridId]: prev[gridId].filter((item) => item.id !== id),
    }));
  }, []);

  const getItemRefFromListById = React.useCallback(
    (id: string, gridId: string) => {
      const item = itemRefList[gridId].find((item) => item.id === id);
      return item?.ref ?? null;
    },
    [itemRefList],
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      grids,
      setGrids,
      addItemRefToList,
      removeItemRefFromList,
      itemRefList,
      getItemRefFromListById,
    }),
    [grids, itemRefList, addItemRefToList, removeItemRefFromList, getItemRefFromListById],
  );

  return <GridstackContext.Provider value={value}>{children}</GridstackContext.Provider>;
};
