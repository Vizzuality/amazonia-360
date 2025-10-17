"use client";

import { useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { DeckLayer } from "@deck.gl/arcgis";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { polygonToCells } from "h3-js";
import { useDebounce } from "rooks";

import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { useMap } from "@/components/map/provider";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

const DEFAULT_POLYGON = [
  [-62.27200350313281, 10.059344259828194],
  [-67.06652640302832, 7.16119855145547],
  [-67.943239161867, 4.927255709942727],
  [-72.40899477719823, 3.1509279361129785],
  [-74.27200938972979, 3.3424009481836663],
  [-76.08022945483314, 1.5906684122267194],
  [-76.65557220282086, 1.9466627161037167],
  [-79.58708049018557, -6.014492893412736],
  [-74.51858485315248, -14.445402662243424],
  [-71.23091200751009, -15.820619298579118],
  [-70.43639106981236, -14.233052800550254],
  [-69.14871920526923, -14.922445177242096],
  [-66.21721091790451, -19.190605118473343],
  [-65.5596763487759, -18.802027970739758],
  [-64.08022356823614, -20.58179513007903],
  [-60.819947996307135, -18.95756763385569],
  [-59.91583796375511, -17.26505150511234],
  [-60.62816708031124, -16.478518741887086],
  [-58.32679608836111, -16.32082300845299],
  [-58.10761789865178, -17.50036580071513],
  [-57.39528878209566, -17.891878250126737],
  [-53.69665683074733, -17.29121245544772],
  [-53.915835020456626, -17.996136700327312],
  [-53.0391222616187, -18.126373114163954],
  [-45.88843382234546, -14.604532289149248],
  [-45.641858358922036, -9.839855877331075],
  [-43.8884328412455, -6.5319223339355545],
  [-43.97062466238711, -2.5726479227501073],
  [-45.03911833722094, -1.2035606095028015],
  [-47.970626624585606, -0.6556893456712203],
  [-49.97062760568562, 0.7415365989991614],
  [-49.88843578454399, 1.7002123020146485],
  [-50.71035399595513, 2.1656996489487454],
  [-51.477477659938046, 4.435751567149751],
  [-53.12131408275961, 2.1656996489487454],
  [-54.49117776844433, 2.3299567454877774],
  [-53.943232294170755, 3.6158684822524094],
  [-54.40898594730345, 4.981845516554813],
  [-53.943232294170755, 5.82737746382206],
  [-54.92953414786366, 6.099867214833779],
  [-57.12131604495882, 5.990887583815535],
  [-58.38159063578857, 6.998068257916273],
  [-59.203508847199004, 8.138709891189038],
  [-60.71035890145214, 8.680761469885354],
  [-60.71035890145214, 9.465334994277853],
  [-62.27200350313281, 10.059344259828194],
];

export const getPlaceholderGridLayerProps = ({
  geometry,
  zoom,
}: {
  geometry: __esri.Polygon | null;
  zoom?: number;
}) => {
  const polygon = geometry ? geometry.rings[0] : DEFAULT_POLYGON;
  const res = geometry ? 5 : Math.min(4, Math.floor(zoom || 4));
  const cells = polygonToCells(
    polygon.map((p) => p.toReversed()),
    res,
  );

  // Create array of 4n values
  return new H3HexagonLayer<string>({
    id: `placeholder-grid`,
    data: cells,
    highPrecision: true,
    opacity: 1,
    pickable: false,
    filled: false,
    extruded: false,
    // HEXAGON
    getHexagon: (d) => d,
    // LINE
    stroked: true,
    getLineColor: [0, 154, 222, 255],
    getLineWidth: 1,
    lineWidthUnits: "pixels",
  });
};

export default function PlaceholderGridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const [location] = useSyncLocation();
  const map = useMap();
  const [zoom, setZoom] = useState(map?.view?.zoom);

  const setZoomDebounced = useDebounce((z: number) => {
    setZoom(z);
  }, 100);

  map?.view?.watch("zoom", setZoomDebounced);

  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [
          getPlaceholderGridLayerProps({
            geometry: GEOMETRY,
            zoom,
          }),
        ],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getPlaceholderGridLayerProps({
        geometry: GEOMETRY,
        zoom,
      }),
    ];

    return GRID_LAYER.current;
  }, [GEOMETRY, zoom]);

  return <Layer index={0} layer={layer} />;
}
