import { useState } from "react";

import { DATASETS, DatasetIds } from "@/constants/datasets";
import { TOPICS } from "@/constants/topics";

import WidgetEcosystemsByType from "@/containers/widgets/environment/ecosystems-by-type";
import WidgetLandCoverByType from "@/containers/widgets/environment/land-cover-by-type";
import WidgetEnvironmentSummary from "@/containers/widgets/environment/summary";
import WidgetMap from "@/containers/widgets/map";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export default function WidgetsEnvironment() {
  const [layer, setLayer] = useState<DatasetIds>("land_cover");
  const T = TOPICS.find((t) => t.id === "natural-physical-environment");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6 grid grid-cols-12 gap-2 items-stretch">
          <div className="col-span-12">
            <WidgetEnvironmentSummary />
          </div>
          <div className="col-span-6 h-full flex flex-col">
            <WidgetEcosystemsByType />
          </div>
          <div className="col-span-6 h-full flex flex-col">
            <WidgetLandCoverByType />
          </div>
        </div>
        <div className="col-span-6 relative">
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
                <SelectItem value={DATASETS.land_cover.layer.id}>
                  {DATASETS.land_cover.layer.title}
                </SelectItem>
                <SelectItem value={DATASETS.ecosistemas.layer.id}>
                  {DATASETS.ecosistemas.layer.title}
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
          <WidgetMap ids={[layer]} />
        </div>
      </div>
    </div>
  );
}
