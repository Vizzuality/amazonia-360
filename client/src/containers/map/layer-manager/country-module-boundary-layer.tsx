"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import { useGetCountryAmazoniaBoundary } from "@/lib/country/coverage";

import { COUNTRY_MODULE_BOUNDARY_SYMBOL } from "@/constants/map";

import { useCountry } from "@/i18n/use-country";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export default function CountryModuleBoundaryLayer({ index }: { index: number }) {
  const country = useCountry();
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
