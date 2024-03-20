"use client";

import { Provider as JotaiProvider } from "jotai";

import { MapProvider } from "@/components/map/provider";

export default function LayoutProviders({
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
