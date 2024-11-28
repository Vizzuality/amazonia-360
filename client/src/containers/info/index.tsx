import { DATASETS, DatasetIds } from "@/constants/datasets";

import InfoArcGis from "@/containers/info/arcgis";
import InfoRaster from "@/containers/info/raster";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function Info({ ids }: { ids: DatasetIds[] }) {
  return (
    <ScrollArea className="flex max-h-[calc(100svh_-_theme(space.20))] grow flex-col">
      <ul className="space-y-4 divide-y p-6">
        {ids.map((id) => {
          const DATASET = DATASETS[id];

          if (DATASET?.metadata?.type === "arcgis") {
            return <InfoArcGis key={id} id={+id} />;
          }

          if (DATASET?.metadata?.type === "raster") {
            return <InfoRaster key={id} id={id} />;
          }

          return null;
        })}
      </ul>
    </ScrollArea>
  );
}
