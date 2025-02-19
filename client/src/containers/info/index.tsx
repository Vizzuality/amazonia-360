import { useIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/app/local-api/indicators/route";

import { Markdown } from "@/components/ui/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

const InfoItem = ({ id }: { id: Indicator["id"] }) => {
  const indicator = useIndicatorsId(id);

  return (
    <Markdown>{indicator?.description_en}</Markdown>
    // <>
    //   {indicator?.resource?.type === "imagery-tile" && <InfoRaster key={id} id={+id} />}
    //   {indicator?.resource?.type === "feature" && <InfoArcGis key={id} id={id} />}
    // </>
  );
};

export default function Info({ ids }: { ids: Indicator["id"][] }) {
  return (
    <ScrollArea className="flex max-h-[calc(100svh_-_theme(space.20))] grow flex-col">
      <ul className="space-y-4 divide-y p-6">
        {ids.map((id) => (
          <InfoItem key={id} id={id} />
        ))}
      </ul>
    </ScrollArea>
  );
}
