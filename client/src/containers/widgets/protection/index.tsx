"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { DATASETS, DatasetIds } from "@/constants/datasets";
import { TOPICS } from "@/constants/topics";

import { Card } from "@/containers/card";
import WidgetsColumn from "@/containers/widgets/column";
import WidgetMap from "@/containers/widgets/map";
import WidgetForestFires from "@/containers/widgets/protection/forest-fires";
import WidgetIndigenousLands from "@/containers/widgets/protection/indigenous-lands";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";
import WidgetsRow from "@/containers/widgets/row";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export default function WidgetsProtection({ index }: { index: number }) {
  const [layer, setLayer] = useState<DatasetIds>("areas_protegidas");

  const T = TOPICS.find((t) => t.id === "protection");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn
          className={cn("col-span-6", index % 2 !== 0 && "order-2")}
        >
          <WidgetsRow>
            <WidgetsColumn className="col-span-6">
              <WidgetForestFires />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-6">
              <WidgetIndigenousLands />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12">
              <WidgetProtectedAreas />
            </WidgetsColumn>
          </WidgetsRow>
        </WidgetsColumn>

        <WidgetsColumn className="col-span-6">
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

          <Card className="p-0 h-full relative">
            <WidgetMap ids={[layer]} />
          </Card>
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
