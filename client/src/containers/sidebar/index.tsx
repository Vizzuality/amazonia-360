"use client";

import { ChangeEvent } from "react";

import { useSyncLayers } from "@/app/store";

import { LAYERS } from "@/constants/layers";

export default function Sidebar() {
  const [layers, setLayers] = useSyncLayers();

  const handleLayerChange = (
    e: ChangeEvent<HTMLInputElement>,
    layerId: string,
  ) => {
    setLayers((layers) => {
      if (e.target.checked) {
        return [layerId, ...layers];
      }

      return layers.filter((l) => l !== layerId);
    });
  };

  return (
    <aside className="w-96 bg-gray-200">
      <h1>Layer Manager</h1>

      {LAYERS.map((layer) => (
        <div key={layer.id}>
          <input
            type="checkbox"
            id={layer.id}
            checked={layers.includes(layer.id)}
            onChange={(e) => handleLayerChange(e, layer.id)}
          />
          <label htmlFor={layer.id}>{layer.title}</label>
        </div>
      ))}
    </aside>
  );
}
