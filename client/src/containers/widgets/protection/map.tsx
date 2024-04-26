import { useState } from "react";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import { Card } from "@/containers/card";
import Legend from "@/containers/legend";
import LegendItem from "@/containers/legend/item";
import WidgetMap from "@/containers/widgets/map";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export default function WidgetsProtectionMap() {
  const [layer, setLayer] = useState<DatasetIds>("areas_protegidas");
  const legend = DATASETS[layer]?.legend;

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
            <SelectItem value={DATASETS.areas_protegidas.layer.id}>
              {DATASETS.areas_protegidas.layer.title}
            </SelectItem>
            <SelectItem value={DATASETS.tierras_indigenas.layer.id}>
              {DATASETS.tierras_indigenas.layer.title}
            </SelectItem>
            <SelectItem value={DATASETS.fires.layer.id}>
              {DATASETS.fires.layer.title}
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

      <Card className="h-full p-0 relative">
        <WidgetMap ids={[layer]} />
      </Card>
    </>
  );
}
