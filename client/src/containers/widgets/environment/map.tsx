import { useState } from "react";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import { Card } from "@/containers/card";
import Legend from "@/containers/legend";
import LegendItem from "@/containers/legend/item";
import WidgetMap from "@/containers/widgets/map";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export default function WidgetsEnvironmentMap() {
  const [layer, setLayer] = useState<DatasetIds>("elevation_ranges");
  const legend = DATASETS[layer]?.legend;

  return (
    <>
      <div className="absolute left-4 top-4 z-10">
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
            <SelectItem value={DATASETS.biomas.layer.id}>{DATASETS.biomas.layer.title}</SelectItem>
            <SelectItem value={DATASETS.tipos_climaticos.layer.id}>
              {DATASETS.tipos_climaticos.layer.title}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!!legend && (
        <div className="absolute bottom-4 left-4 z-10">
          <Legend>
            <LegendItem {...legend} direction="vertical" />
          </Legend>
        </div>
      )}

      <Card className="relative h-full p-0">
        <WidgetMap
          ids={[layer]}
          popup={{
            dockEnabled: true,
            dockOptions: {
              buttonEnabled: false,
              breakpoint: false,
              position: "bottom-right",
            },
            visibleElements: {
              featureNavigation: false,
            },
            viewModel: {
              includeDefaultActions: false,
              features: [],
            },
            collapseEnabled: false,
          }}
        />
      </Card>
    </>
  );
}
