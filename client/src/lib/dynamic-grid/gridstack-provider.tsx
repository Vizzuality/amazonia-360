// gridstack-context.tsx
"use client";

import * as React from "react";

import type { GridStack } from "gridstack";

import type { ItemRefType } from "./gridstack-item";

type GridStackContextType = {
  grid: GridStack | null;
  setGrid: React.Dispatch<React.SetStateAction<GridStack | null>>;
  addItemRefToList: (id: string, ref: ItemRefType) => void;
  removeItemRefFromList: (id: string) => void;
  itemList: ItemListType;
  getItemRefFromListById: (id: string) => ItemRefType | null;
};

type ItemListType = {
  id: string;
  ref: ItemRefType;
}[];

export const GridstackContext = React.createContext<GridStackContextType | null>(null);

export const GridstackProvider = ({ children }: { children: React.ReactNode }) => {
  const [grid, setGrid] = React.useState<GridStack | null>(null);
  const [itemList, setItemList] = React.useState<ItemListType>([]);

  const addItemRefToList = React.useCallback((id: string, ref: ItemRefType) => {
    setItemList((prev) => [...prev, { id, ref }]);
  }, []);

  const removeItemRefFromList = React.useCallback((id: string) => {
    setItemList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getItemRefFromListById = React.useCallback(
    (id: string) => {
      const item = itemList.find((item) => item.id === id);
      return item?.ref ?? null;
    },
    [itemList],
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      grid,
      setGrid,
      addItemRefToList,
      removeItemRefFromList,
      itemList,
      getItemRefFromListById,
    }),
    [grid, itemList, addItemRefToList, removeItemRefFromList, getItemRefFromListById],
  );

  return <GridstackContext.Provider value={value}>{children}</GridstackContext.Provider>;
};
