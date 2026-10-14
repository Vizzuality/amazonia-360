import { DATASETS } from "@/constants/datasets";

import { LayerProps } from "@/components/map/layers/types";

const MODULE_AREA_AFP_RENDERER = {
  type: "simple",
  symbol: {
    type: "simple-fill",
    color: [0, 0, 0, 0],
    style: "solid",
    outline: {
      style: "dot",
      width: 1.5,
      color: [0, 78, 112, 0.45],
    },
  },
};

export function getAreaAfpLayer(country: string | null): LayerProps {
  if (!country) return DATASETS.area_afp.layer as LayerProps;

  return {
    ...DATASETS.area_afp.layer,
    id: `${DATASETS.area_afp.layer.id}-module`,
    renderer: MODULE_AREA_AFP_RENDERER,
  } as LayerProps;
}
