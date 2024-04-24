import { useState } from "react";

import { cn } from "@/lib/utils";

import { DATASETS, DatasetIds } from "@/constants/datasets";
import { TOPICS } from "@/constants/topics";

import { Card } from "@/containers/card";
import WidgetsColumn from "@/containers/widgets/column";
import WidgetAltitude from "@/containers/widgets/environment/altitude";
import WidgetBiomesByType from "@/containers/widgets/environment/biomes-by-type";
import WidgetLandCoverByType from "@/containers/widgets/environment/land-cover-by-type";
import WidgetEnvironmentSummary from "@/containers/widgets/environment/summary";
import WidgetMap from "@/containers/widgets/map";
import WidgetsRow from "@/containers/widgets/row";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export default function WidgetsEnvironment({ index }: { index: number }) {
  const [layer, setLayer] = useState<DatasetIds>("elevation_ranges");
  const T = TOPICS.find((t) => t.id === "natural-physical-environment");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn
          className={cn(
            "col-span-6 print:col-span-12",
            index % 2 !== 0 && "order-2",
          )}
        >
          <WidgetsRow>
            <WidgetsColumn className="col-span-12">
              <WidgetEnvironmentSummary />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12">
              <WidgetAltitude />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-6 h-full flex flex-col">
              <WidgetBiomesByType />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-6 h-full flex flex-col">
              <WidgetLandCoverByType />
            </WidgetsColumn>
          </WidgetsRow>
        </WidgetsColumn>
        <WidgetsColumn className="col-span-6 print:break-before-page">
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
          <Card className="h-full p-0 relative">
            <WidgetMap ids={[layer]} />
          </Card>
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
