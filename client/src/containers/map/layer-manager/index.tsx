"use client";

import { useMemo } from "react";

import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

import { useSyncDatasets } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import Layer from "@/components/map/layers";
import GeojsonLayer from "@/components/map/layers/geojson";

import GEOJSON from "@/data/geojson.json";

export default function LayerManager() {
  const [layers] = useSyncDatasets();

  const geojsonLayer = useMemo(() => {
    const blob = new Blob([JSON.stringify(GEOJSON)], {
      type: "application/json",
    });

    const f = new GeoJSONLayer({
      id: "geojson",
      title: "GeoJSON",
      url: URL.createObjectURL(blob),
      renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: "#009ADE11",
          outline: {
            color: "#004E70",
            width: 2,
          },
        }),
      }),
    });

    // f.on("layerview-create", () => {
    //   f.queryExtent().then(({ extent }) => {
    //     if (extent && mapInstance) {
    //       // view.goTo(extent);
    //       mapInstance.view.goTo(extent.expand(1.5), {
    //         duration: 1000,
    //       });
    //       // console.log(extent);
    //     }
    //   });
    // });

    return f;
  }, []);

  return (
    <>
      {layers.map((layer, i) => {
        const l = DATASETS[layer].layer;
        // l!.opacity = opacity;

        if (!l) {
          return null;
        }

        return <Layer key={l.id} layer={l} index={i} />;
      })}

      <GeojsonLayer layer={geojsonLayer} index={layers.length} />
    </>
  );
}
