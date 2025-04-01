import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/app/local-api/indicators/route";

export default function InfoRaster({ id }: { id: Indicator["id"] }) {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  return (
    <div className="space-y-4 pt-4 first:pt-0">
      <h2 className="text-xl">{indicator?.name}</h2>
      {/* <div className="prose-sm prose-a:break-words prose-a:underline">
        {parse(DATASET?.metadata?.data || "")}
      </div> */}
    </div>
  );
}
