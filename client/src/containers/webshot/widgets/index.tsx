"use client";

// Extend the globalThis type to include the READY property
declare global {
  var READY: boolean;
}

import { PropsWithChildren } from "react";

import { useParams } from "next/navigation";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import { LoadProvider } from "@/containers/indicators/load-provider";

export const Screenshot = ({ children }: PropsWithChildren) => {
  const handleLoad = () => {
    globalThis.READY = true;
  };

  const params = useParams<{ id: `${Indicator["id"]}`; type: VisualizationTypes }>();

  const { id, type } = params;

  return (
    <LoadProvider onLoad={handleLoad} indicator={{ id: +id, type }}>
      {children}
    </LoadProvider>
  );
};

export default Screenshot;
