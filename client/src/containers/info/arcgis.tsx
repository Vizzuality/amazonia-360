import parse from "html-react-parser";

import { useIndicatorsId } from "@/lib/indicators";
import { useGetMetadata } from "@/lib/query";

import { Indicator } from "@/app/api/indicators/route";

import { CardLoader } from "@/containers/card";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function InfoArcGis({ id }: { id: Indicator["id"] }) {
  const indicator = useIndicatorsId(id);
  const query = useGetMetadata(
    { id, url: `${indicator?.metadata?.url}` },
    { enabled: !!indicator },
  );

  return (
    <ScrollArea className="flex max-h-[calc(100svh_-_theme(space.20))] grow flex-col">
      <div className="space-y-4 divide-y p-6">
        <div className="space-y-4 pt-4 first:pt-0">
          <h2 className="text-xl">{indicator?.name}</h2>
          <CardLoader query={[query]} className="h-40">
            <div className="prose-sm prose-a:break-words prose-a:underline">
              {parse(query?.data?.metadata || "")}
            </div>
          </CardLoader>
        </div>
      </div>
    </ScrollArea>
  );
}
