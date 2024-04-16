"use client";

import { useState } from "react";

import { DATASETS, DatasetIds } from "@/constants/datasets";
import { TOPICS } from "@/constants/topics";

import WidgetMap from "@/containers/widgets/map";
import WidgetForestFires from "@/containers/widgets/protection/forest-fires";
import WidgetIndigenousLands from "@/containers/widgets/protection/indigenous-lands";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export default function WidgetsProtection() {
  const [layer, setLayer] = useState<DatasetIds>("areas_protegidas");

  const T = TOPICS.find((t) => t.id === "protection");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <div className="grid grid-cols-12 gap-2 items-stretch">
            <div className="col-span-6">
              <WidgetForestFires />
            </div>
            <div className="col-span-6">
              <WidgetIndigenousLands />
            </div>
            <div className="col-span-12">
              <WidgetProtectedAreas />
            </div>
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
                <span>{DATASETS[layer].layer.title}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DATASETS.areas_protegidas.layer.id}>
                  {DATASETS.areas_protegidas.layer.title}
                </SelectItem>
                <SelectItem value={DATASETS.tierras_indigenas.layer.id}>
                  {DATASETS.tierras_indigenas.layer.title}
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
