"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import { useGetCountryAmazoniaBoundary } from "@/lib/country/coverage";
import { useGetCountryModule } from "@/lib/country-modules";

import { COUNTRY_MODULE_BOUNDARY_SYMBOL } from "@/constants/map";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export default function CountryModuleBoundaryLayer({ index }: Readonly<{ index: number }>) {
  const country = useGetCountryModule()?.country ?? null;
  const { data: boundary } = useGetCountryAmazoniaBoundary(country ?? "");

  const [graphicsLayer] = useState(
    () =>
      new GraphicsLayer({
        id: "country-module-boundary",
        title: "Country module boundary",
        listMode: "hide",
      }),
  );

  useEffect(() => {
    graphicsLayer.removeAll();

    if (!boundary) return;

    graphicsLayer.add(
      new Graphic({
        geometry: boundary,
        symbol: COUNTRY_MODULE_BOUNDARY_SYMBOL,
      }),
    );
  }, [boundary, graphicsLayer]);

  if (!country || !boundary) return null;

  return <Layer index={index} layer={graphicsLayer} />;
}
