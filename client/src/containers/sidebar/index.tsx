"use client";

import { ChangeEvent } from "react";

import { getKeys } from "@/lib/utils";

import { useSyncDatasets } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import Test from "@/containers/test";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function Sidebar() {
  const [datasets, setDatasets] = useSyncDatasets();

  const handleLayerChange = (
    e: ChangeEvent<HTMLInputElement>,
    layerId: DatasetIds,
  ) => {
    setDatasets((layers) => {
      if (e.target.checked) {
        return [...layers, layerId];
      }

      return layers.filter((l) => l !== layerId);
    });
  };

  return (
    <aside className="flex flex-col w-[600px] shrink-0 max-h-screen bg-white overflow-hidden">
      <ScrollArea className="grow w-full">
        <div className="space-y-6 p-4 overflow-hidden">
          <h1 className="text-2xl">Layer Manager</h1>

          <ul className="space-y-4">
            {getKeys(DATASETS).map((d) => {
              const layer = DATASETS[d].layer;
              return (
                <div key={layer.id} className="flex space-x-2">
                  <input
                    type="checkbox"
                    id={layer.id}
                    checked={datasets.includes(layer.id as DatasetIds)}
                    onChange={(e) =>
                      handleLayerChange(e, layer.id as DatasetIds)
                    }
                  />
                  <label htmlFor={layer.id} className="leading-none">
                    {layer.title}
                  </label>
                </div>
              );
            })}
          </ul>

          {datasets.toReversed().map((d) => (
            <Test key={d} id={d} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
