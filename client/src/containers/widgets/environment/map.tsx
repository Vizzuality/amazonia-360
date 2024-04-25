import { useState } from "react";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import { Card } from "@/containers/card";
import Legend from "@/containers/legend";
import LegendOrdinal from "@/containers/legend/ordinal";
import WidgetMap from "@/containers/widgets/map";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export default function WidgetsEnvironmentMap() {
  const [layer, setLayer] = useState<DatasetIds>("elevation_ranges");

  return (
    <>
      <div className="absolute top-4 left-4 z-10">
        <Select
          value={layer}
          onValueChange={(l) => {
            setLayer(l as DatasetIds);
          }}
        >
          <SelectTrigger>
            <div>
              <span className="text-gray-500">See: </span>
              {DATASETS[layer].layer.title}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DATASETS.elevation_ranges.layer.id}>
              {DATASETS.elevation_ranges.layer.title}
            </SelectItem>
            <SelectItem value={DATASETS.land_cover.layer.id}>
              {DATASETS.land_cover.layer.title}
            </SelectItem>
            <SelectItem value={DATASETS.biomas.layer.id}>
              {DATASETS.biomas.layer.title}
            </SelectItem>
            <SelectItem value={DATASETS.tipos_climaticos.layer.id}>
              {DATASETS.tipos_climaticos.layer.title}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!!DATASETS[layer]?.legend && (
        <div className="absolute bottom-4 left-4 z-10">
          <Legend>
            {DATASETS[layer]?.legend?.type === "ordinal" && (
              <LegendOrdinal
                ordinalColorScale={DATASETS[layer]?.legend?.scale}
                direction="vertical"
              />
            )}
          </Legend>
        </div>
      )}

      <Card className="h-full p-0 relative">
        <WidgetMap ids={[layer]} />
      </Card>
    </>
  );
}
