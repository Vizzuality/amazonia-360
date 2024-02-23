import dynamic from "next/dynamic";

import LayerManager from "@/containers/map/layer-manager";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  return (
    <div className="w-full h-screen">
      <Map id="default">
        <LayerManager />
      </Map>
    </div>
  );
}
