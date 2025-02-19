import parse from "html-react-parser";

import { useIndicatorsId } from "@/lib/indicators";
import { useGetMetadata } from "@/lib/query";

import { Indicator } from "@/app/local-api/indicators/route";

import { CardLoader } from "@/containers/card";

export default function InfoArcGis({ id }: { id: Indicator["id"] }) {
  const indicator = useIndicatorsId(id);

  // TO - Do - improve this
  const query = useGetMetadata(
    indicator && indicator.resource.type !== "h3"
      ? { id, url: `${indicator.resource.url}/info/metadata` }
      : { id: 0, url: "" },
    { enabled: !!indicator && indicator.resource.type !== "h3" },
  );

  if (!indicator || indicator.resource.type === "h3") return null;

  return (
    <div className="space-y-4 pt-4 first:pt-0">
      <h2 className="text-xl">{indicator?.name_en}</h2>
      <CardLoader query={[query]} className="h-40">
        <div className="prose-sm prose-a:break-words prose-a:underline">
          {parse(query?.data?.metadata || "")}
        </div>
      </CardLoader>
    </div>
  );
}
