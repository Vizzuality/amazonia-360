"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import Point from "@arcgis/core/geometry/Point";
import { project } from "@arcgis/core/geometry/projection";
import { DeckLayer } from "@deck.gl/arcgis";
import { Accessor, Color, PickingInfo } from "@deck.gl/core";
import { DataFilterExtension, DataFilterExtensionProps } from "@deck.gl/extensions";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import { ArrowTable } from "@loaders.gl/arrow";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";
import { cellToLatLng, latLngToCell } from "h3-js";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import { env } from "@/env.mjs";

import { useMeta } from "@/lib/grid";
import { getGeometryWithBuffer, useLocationGeometry } from "@/lib/location";

import { MultiDatasetMeta } from "@/types/generated/api.schemas";

import {
  gridHoverAtom,
  gridCellHighlightAtom,
  useSyncGridDatasets,
  useSyncGridDatasetContinousSettings,
  useSyncGridTableSettings,
  useSyncGridSelectedDataset,
  useSyncLocation,
  GridHoverType,
  tmpBboxAtom,
  sketchAtom,
  useSyncGridDatasetCategoricalSettings,
} from "@/app/(frontend)/store";

import { BUFFERS } from "@/constants/map";

import H3TileLayer from "@/components/map/layers/h3-tile-layer";
import { useMap } from "@/components/map/provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export const getGridLayerProps = ({
  gridDatasets,
  gridDatasetContinousSettings,
  gridSelectedDataset,
  opacity,
  getFillColor,
  gridMetaData,
  geometry,
  zoom,
  gridHover,
  setGridHover,
  gridCellHighlight,
  onCellClick,
  sketchEnabled,
}: {
  gridDatasets: string[];
  gridDatasetContinousSettings: Record<string, number[] | undefined> | null;
  gridSelectedDataset: string | null;
  opacity: number;
  getFillColor: Accessor<Record<string, number>, Color>;
  gridMetaData: MultiDatasetMeta | undefined;
  geometry: __esri.Polygon | null;
  zoom?: number;
  gridHover: GridHoverType;
  setGridHover: (props: GridHoverType) => void;
  gridCellHighlight?: string;
  onCellClick?: (info: PickingInfo) => void;
  sketchEnabled: "create" | "edit" | undefined;
}) => {
  // Create array of 4n values
  const filters = [...Array(4).keys()];
  // const categories = [...Array(3).keys()];
  const columns = !!gridDatasets.length ? gridDatasets.map((d) => `columns=${d}`).join("&") : "";

  return new H3TileLayer({
    id: `tile-h3s`,
    data: `${env.NEXT_PUBLIC_API_URL}/grid/tile/{h3index}?${columns}`,
    extent: [-80.3603, -36.5016, -43.8134, 20.8038],
    visible: !!gridDatasets.length && gridSelectedDataset !== "no-layer",
    getTileData: (tile) => {
      if (!tile.url) return Promise.resolve(null);
      return load(tile.url, ArrowLoader, {
        arrow: { shape: "arrow-table" },
        // arrow: { shape: "object-row-table" },
        fetch: {
          method: !!geometry ? "POST" : "GET",
          ...(!!geometry && {
            body: JSON.stringify({
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: geometry?.toJSON().rings,
              },
            }),
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
          },
        },
      }).then((data) => {
        return Object.assign(data.data, {
          length: data.data.numRows,
        });
      });
    },
    pickable: !sketchEnabled,
    onClick: (info: PickingInfo) => {
      if (!!sketchEnabled) return;
      if (onCellClick) onCellClick(info);
    },
    onHover: (info: PickingInfo) => {
      if (!!sketchEnabled) return;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const table = info?.tile?.content as ArrowTable["data"];
      const row = table?.get(info.index);

      const values = gridDatasets.map((column) => {
        const value = row?.[column];
        if (typeof value === "bigint") {
          return {
            column,
            value: Number(value),
          };
        }
        return {
          column,
          value,
        };
      });

      if (info && info.index === -1) {
        // setHoveredCell(null);
        setGridHover({
          id: null,
          cell: undefined,
          index: undefined,
          values: [],
          x: null,
          y: null,
          coordinates: undefined,
        });
      }

      if (info && info.index !== -1 && info.coordinate) {
        const cell = latLngToCell(info?.coordinate?.[1], info.coordinate[0], 6);
        setGridHover({
          id: info.index,
          cell,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          index: info.sourceLayer?.props?.tile?.index?.h3index,
          values,
          x: info.x,
          y: info.y,
          coordinates: info.coordinate,
        });
      }
    },
    maxCacheSize: 300, // max number of tiles to keep in the cache
    _subLayerProps: {
      gridDatasets,
      gridDatasetContinousSettings: gridDatasetContinousSettings
        ? gridDatasetContinousSettings
        : {},
    },
    updateTriggers: {
      getTileData: [geometry],
      opacity: [opacity],
    },
    renderSubLayers: (props) => {
      if (!props.data) {
        return null;
      }

      const getFilterValue: Accessor<Record<string, number>, number[]> = (d) => {
        return filters.map((f) => {
          if (gridDatasets[f]) {
            const legend = gridMetaData?.datasets.find(
              (dataset) => dataset.var_name === gridDatasets[f],
            )?.legend;

            if (legend?.legend_type === "continuous" && "stats" in legend) {
              if (typeof d[`${gridDatasets[f]}`] === "bigint") {
                return Number(d[`${gridDatasets[f]}`]);
              }
              return d[`${gridDatasets[f]}`];
            }
          }

          return 0;
        });
      };

      const filterRange = () => {
        return filters.map((f) => {
          if (gridDatasets[f]) {
            const legend = gridMetaData?.datasets.find(
              (dataset) => dataset.var_name === gridDatasets[f],
            )?.legend;

            if (legend?.legend_type === "continuous" && "stats" in legend) {
              const stats = legend?.stats?.find((s) => s.level === 1);

              return (gridDatasetContinousSettings?.[gridDatasets[f]] || [
                stats?.min,
                stats?.max,
              ]) as [number, number];
            }

            return [-1, 1] as [number, number];
          }

          return [-1, 1] as [number, number];
        });
      };

      // https://github.com/visgl/deck.gl/issues/9497
      // https://github.com/visgl/deck.gl/issues/9496
      // https://github.com/visgl/deck.gl/issues/9737
      /* We’re currently unable to upgrade deck.gl because the ArcGIS plugin we depend on is outdated and unmaintained.
        •	As shown in deck.gl issue #9496 and #9497, the ArcGIS integration hasn’t been updated to support newer deck.gl versions. This means that upgrading would break our map rendering and integration pipeline. Since the plugin has no active maintainers, there’s no clear path forward for compatibility fixes.
        •	Because of that, we’re effectively stuck on deck.gl v9.0.40, which is the last version compatible with the ArcGIS plugin. However, this version has a known problem described in #9737 — hover and click events behave inconsistently across different computers and browsers.
        •	The same version also prevents us from using or fixing newer features such as filterCategories in the DataFilterExtension, since those improvements exist only in later deck.gl releases that the ArcGIS plugin can’t support.
      For this reason, categorical filtering will be handled directly inside getFillColor as a workaround.
      This approach is less performant, since filtering happens on the CPU rather than efficiently on the GPU through the DataFilterExtension, but it’s currently the only viable option given our dependency on the ArcGIS plugin.
      */

      // const getFilterCategory: Accessor<
      //   Record<string, number>,
      //   number | string | (number | string)[]
      // > = (d) => {
      //   const c = categories.map((f) => {
      //     if (gridDatasets[f]) {
      //       const legend = gridMetaData?.datasets.find(
      //         (dataset) => dataset.var_name === gridDatasets[f],
      //       )?.legend;

      //       if (legend?.legend_type === "categorical" && "entries" in legend) {
      //         if (typeof d[`${gridDatasets[f]}`] === "bigint") {
      //           return Number(d[`${gridDatasets[f]}`]);
      //         }
      //         return d[`${gridDatasets[f]}`];
      //       }

      //       return -1;
      //     }

      //     return -1;
      //   });

      //   return c;
      // };

      // const filterCategories = () => {
      //   const c = categories.map((f) => {
      //     if (gridDatasets[f]) {
      //       const legend = gridMetaData?.datasets.find(
      //         (dataset) => dataset.var_name === gridDatasets[f],
      //       )?.legend;

      //       if (legend?.legend_type === "categorical" && "entries" in legend) {
      //         const entries = legend.entries;

      //         const values = gridDatasetContinousSettings?.[gridDatasets[f]];
      //         if (values && Array.isArray(values) && values.length) {
      //           return values;
      //         }

      //         return entries.map((e) => e.value);
      //       }
      //     }

      //     return [-1];
      //   });

      //   return c;
      // };

      return [
        new H3HexagonLayer<
          {
            cell: number;
            [key: string]: number;
          },
          DataFilterExtensionProps
        >({
          ...props,
          id: `${props.id}-${opacity}`,
          data: props.data,
          highPrecision: false,
          visible: !!zoom && zoom >= 7,
          opacity,
          pickable: !sketchEnabled,
          filled: !!gridDatasets.length,
          extruded: false,
          stroked: false,
          getHexagon: (d) => `${d.cell}`,
          getFillColor,
          getFilterValue,
          filterRange: filterRange(),
          // getFilterCategory,
          // filterCategories: filterCategories(),

          extensions: [
            new DataFilterExtension({
              filterSize: filters.length as 0 | 1 | 2 | 3 | 4,
            }),
          ],
          updateTriggers: {
            getFillColor: [getFillColor],
            getFilterValue: [gridDatasets],
            opacity: [opacity],
          },
        }),
        // Outlines
        new H3HexagonLayer({
          ...props,
          id: `${props.id}-grid-${opacity}`,
          data: props.data,
          highPrecision: false,
          opacity: opacity,
          visible: !!zoom && zoom >= 7,
          pickable: !sketchEnabled,
          filled: false,
          extruded: false,
          // HEXAGON
          getHexagon: (d) => `${d.cell}`,
          // LINE
          stroked: true,
          getLineColor: [0, 154, 222, 255],
          getLineWidth: 1,
          lineWidthUnits: "pixels",
          updateTriggers: {
            opacity: [opacity],
          },
        }),
        // Highlight
        new H3HexagonLayer({
          ...props,
          id: `${props.id}-grid-highlight-${opacity}`,
          data: [gridCellHighlight, gridHover.cell].filter(Boolean),
          highPrecision: false,
          opacity: opacity,
          visible: !!zoom && zoom >= 7 && (!!gridCellHighlight || !!gridHover.cell),
          pickable: false,
          filled: true,
          extruded: false,
          // HEXAGON
          getHexagon: (d) => d,
          // LINE
          stroked: true,
          getFillColor: [0, 220, 0, 255],
          getLineColor: [0, 220, 255, 255],
          getLineWidth: 3,
          lineWidthUnits: "pixels",
          updateTriggers: {
            opacity: [opacity],
          },
        }),
        new ScatterplotLayer({
          id: `${props.id}-dots-${opacity}`,
          data: props.data,
          visible: !!zoom && zoom < 7,
          stroked: false,
          pickable: true,
          antialiasing: false,
          radiusUnits: "meters",
          getRadius: 4100, // is the radius of a h3 cell at resolution 5 in meters
          getPosition: (d) => cellToLatLng(d.cell).toReversed() as [number, number, number],
          getFillColor,
          getFilterValue,
          filterRange: filterRange(),
          // getFilterCategory,
          // filterCategories: filterCategories(),
          extensions: [
            new DataFilterExtension({
              filterSize: filters.length as 0 | 1 | 2 | 3 | 4,
            }),
          ],
          getLineWidth: 0,
          opacity,
          updateTriggers: {
            getFillColor: [getFillColor],
            getFilterValue: [gridDatasets],
            opacity: [opacity],
          },
        }),
      ];
    },
  });
};

export default function GridLayer() {
  const t = useTranslations();

  const GRID_LAYER = useRef<typeof DeckLayer | null>(null);

  const [alert, setAlert] = useState<PickingInfo>();

  const [location, setLocation] = useSyncLocation();

  const [gridDatasetContinousSettings] = useSyncGridDatasetContinousSettings();
  const [gridDatasetCategoricalSettings] = useSyncGridDatasetCategoricalSettings();
  const [gridSetUpFilters] = useSyncGridTableSettings();
  const [gridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset] = useSyncGridSelectedDataset();
  const gridCellHighlight = useAtomValue(gridCellHighlightAtom);

  const [gridHover, setGridHover] = useAtom(gridHoverAtom);
  const setTmpBbox = useSetAtom(tmpBboxAtom);
  const sketch = useAtomValue(sketchAtom);

  const map = useMap();
  const [zoom, setZoom] = useState(map?.view?.zoom);

  map?.view?.watch("zoom", setZoom);
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const { META: gridMetaData } = useMeta(GEOMETRY);

  const CATEGORICAL_DATASETS = useMemo(() => {
    if (!gridMetaData || !gridDatasets.length) return [];
    return gridMetaData.datasets
      .filter((d) => {
        return (
          gridDatasets.includes(d.var_name) &&
          d.legend.legend_type === "categorical" &&
          "entries" in d.legend
        );
      })
      .map((d) => {
        if (d.legend.legend_type === "categorical" && "entries" in d.legend) {
          return {
            ...d,
            settings:
              gridDatasetCategoricalSettings?.[d.var_name] || d.legend.entries.map((e) => e.value),
          };
        }
        return d;
      });
  }, [gridDatasets, gridDatasetCategoricalSettings, gridMetaData]);

  const colorscale = useMemo(() => {
    if (!gridMetaData) return CHROMA.scale([]);

    if (!gridSelectedDataset) return CHROMA.scale([]);

    if (gridSelectedDataset) {
      const dataset = gridMetaData.datasets.find(
        (dataset) => dataset.var_name === gridSelectedDataset,
      );

      if (dataset?.legend.legend_type === "continuous" && "stats" in dataset.legend) {
        const s = dataset.legend.stats.find((stat) => stat.level === 1);

        return CHROMA.scale("viridis").domain([s?.min || 0, s?.max || 100]);
      }

      if (dataset?.legend.legend_type === "categorical" && "entries" in dataset.legend) {
        const entries = dataset.legend.entries;
        return CHROMA.scale(entries.map((e) => e.color)).domain(entries.map((e) => +e.value));
      }
    }

    return CHROMA.scale("viridis").domain([0, 100]);
  }, [gridSelectedDataset, gridMetaData]);

  const getFillColor = useCallback(
    (d: Record<string, number>): Color => {
      const v =
        typeof d[`${gridSelectedDataset}`] === "bigint"
          ? Number(d[`${gridSelectedDataset}`])
          : d[`${gridSelectedDataset}`];

      // If there are active categorical datasets, check if the value is in all of them
      if (!!CATEGORICAL_DATASETS.length) {
        for (const dataset of CATEGORICAL_DATASETS) {
          if (
            dataset.legend.legend_type === "categorical" &&
            "entries" in dataset.legend &&
            "settings" in dataset
          ) {
            const v1 =
              typeof d[`${dataset.var_name}`] === "bigint"
                ? Number(d[`${dataset.var_name}`])
                : d[`${dataset.var_name}`];

            const c1 = dataset.settings || dataset.legend.entries.map((e) => e.value);

            if (c1 && Array.isArray(c1)) {
              if (!c1.includes(v1)) {
                return [0, 0, 0, 0]; // transparent
              }
            }
          }
        }
      }

      return colorscale(v).rgb();
    },
    [gridSelectedDataset, colorscale, CATEGORICAL_DATASETS],
  );

  const onCellClick = useCallback((info: PickingInfo) => {
    if (!info?.coordinate) return;

    setAlert(info);
  }, []);

  const handleConfirmAlert = useCallback(() => {
    if (!alert?.coordinate) return;

    const cell = latLngToCell(alert.coordinate[1], alert.coordinate[0], 6);

    const latLng = cellToLatLng(cell);

    const p = new Point({
      x: latLng[1],
      y: latLng[0],
      spatialReference: { wkid: 4326 },
    });
    const projectedGeom = project(p, { wkid: 102100 });
    const g = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;

    setLocation({
      type: "point",
      geometry: g.toJSON(),
      buffer: BUFFERS.point,
    });

    const gWithBuffer = getGeometryWithBuffer(g, BUFFERS.point);
    if (gWithBuffer) {
      setTmpBbox(gWithBuffer.extent);
    }
  }, [alert, setLocation, setTmpBbox]);

  const opacity = useMemo(() => gridSetUpFilters.opacity * 0.01, [gridSetUpFilters]);

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [
          getGridLayerProps({
            gridDatasets,
            gridDatasetContinousSettings,
            gridSelectedDataset,
            gridMetaData,
            getFillColor,
            opacity,
            geometry: GEOMETRY,
            zoom,
            gridHover,
            setGridHover,
            gridCellHighlight: gridCellHighlight.index,
            onCellClick,
            sketchEnabled: sketch.enabled,
          }),
        ],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({
        gridDatasets,
        gridDatasetContinousSettings,
        gridSelectedDataset,
        gridMetaData,
        getFillColor,
        opacity,
        geometry: GEOMETRY,
        zoom,
        gridHover,
        setGridHover,
        gridCellHighlight: gridCellHighlight.index,
        onCellClick,
        sketchEnabled: sketch.enabled,
      }),
    ];

    return GRID_LAYER.current;
  }, [
    gridDatasets,
    gridDatasetContinousSettings,
    gridSelectedDataset,
    gridMetaData,
    getFillColor,
    opacity,
    GEOMETRY,
    zoom,
    gridHover,
    setGridHover,
    gridCellHighlight,
    onCellClick,
    sketch.enabled,
  ]);

  return (
    <>
      <Layer index={0} layer={layer} />

      <AlertDialog open={!!alert} onOpenChange={() => setAlert(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("grid-sidebar-report-location-filters-alert-redefine-area-title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("grid-sidebar-report-location-filters-alert-redefine-area-description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex w-full justify-end space-x-2 justify-self-end">
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

            <AlertDialogAction onClick={handleConfirmAlert}>{t("continue")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
