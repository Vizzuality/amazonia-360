"use client";

import { Provider as JotaiProvider } from "jotai";

import { MapContainerProvider } from "@/components/map/container-provider";

export default function PageProviders({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <MapContainerProvider>{children}</MapContainerProvider>
    </JotaiProvider>
  );
}
