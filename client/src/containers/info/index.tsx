import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { Markdown } from "@/components/ui/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

const InfoItem = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  return <Markdown>{indicator?.description}</Markdown>;
};

export default function Info({ ids }: { ids: Indicator["id"][] }) {
  return (
    <ScrollArea className="flex max-h-[calc(100svh-calc(var(--spacing)*20))] grow flex-col">
      <ul className="space-y-4 divide-y p-6">
        {ids.map((id) => (
          <InfoItem key={id} id={id} />
        ))}
      </ul>
    </ScrollArea>
  );
}
