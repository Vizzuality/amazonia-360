"use client";

import { MapProvider } from "@/components/map/provider";

export default function LayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapProvider>{children}</MapProvider>;
}
