"use client";

import { Provider as JotaiProvider } from "jotai";

import { MapProvider } from "@/components/map/provider";

export default function PageProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <JotaiProvider>
      <MapProvider>{children}</MapProvider>
    </JotaiProvider>
  );
}
