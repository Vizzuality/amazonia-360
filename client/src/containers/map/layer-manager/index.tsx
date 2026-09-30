"use client";

import dynamic from "next/dynamic";

import {
  useSyncGridDatasets,
  useSyncGridSelectedDataset,
  useSyncIndicators,
} from "@/app/(frontend)/store";

import { getAreaAfpLayer } from "@/containers/map/layer-manager/area-afp-layer";
import CountryModuleBoundaryLayer from "@/containers/map/layer-manager/country-module-boundary-layer";
import GridLayer from "@/containers/map/layer-manager/grid-layer";
import LayerManagerItem from "@/containers/map/layer-manager/item";
import PlaceholderGridLayer from "@/containers/map/layer-manager/placeholder-grid-layer";

import { useCountry } from "@/i18n/use-country";

// import SelectedLayer from "@/containers/map/layer-manager/selected-layer";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export function getCountryModuleBoundaryIndex({
  gridEnabled,
  indicatorsCount,
}: {
  gridEnabled?: boolean;
  indicatorsCount: number;
}) {
  return gridEnabled ? 1 : indicatorsCount + 1;
}

export default function LayerManager({ gridEnabled }: { gridEnabled?: boolean }) {
  const country = useCountry();
  // const [location] = useSyncLocation();
  const [indicators] = useSyncIndicators();
  // const [indicatorsSettings, setIndicatorsSettings] = useSyncIndicatorsSettings();
  const [gridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset] = useSyncGridSelectedDataset();

  // // Sync layers settings with layers
  // useMemo(() => {
  //   if (!indicators?.length && !indicatorsSettings) return;

  //   if (!indicators?.length && indicatorsSettings) {
  //     setTimeout(() => {
  //       setIndicatorsSettings({});
  //     }, 0);
  //     return;
  //   }

  //   const lSettingsKeys = Object.keys(indicatorsSettings || {}).map((key) => Number(key));

  //   lSettingsKeys.forEach((key) => {
  //     if (indicators?.includes(key)) return;

  //     setTimeout(() => {
  //       setIndicatorsSettings((prev) => {
  //         const current = { ...prev };
  //         delete current[key];
  //         return current;
  //       });
  //     }, 0);
  //   });
  // }, [indicators, indicatorsSettings, setIndicatorsSettings]);

  return (
    <>
      <Layer index={0} layer={getAreaAfpLayer(country)} />
      <CountryModuleBoundaryLayer
        index={getCountryModuleBoundaryIndex({
          gridEnabled,
          indicatorsCount: indicators?.length ?? 0,
        })}
      />
      {/* <SelectedLayer location={location} /> */}

      {!gridEnabled &&
        indicators?.map((indicator, index) => (
          <LayerManagerItem key={indicator} id={indicator} index={index} />
        ))}

      {gridEnabled && !!gridDatasets.length && <GridLayer />}
      {gridEnabled &&
        (!gridDatasets.length || (!!gridDatasets.length && gridSelectedDataset === "no-layer")) && (
          <PlaceholderGridLayer />
        )}
    </>
  );
}
