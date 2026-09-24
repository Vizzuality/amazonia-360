import { useLocale } from "next-intl";

import { useGetIndicatorById } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { Markdown } from "@/components/ui/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const InfoItemSkeleton = () => (
  <div className="space-y-3" aria-hidden>
    <Skeleton className="h-6 w-1/2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-11/12" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

const InfoItem = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const { data: indicator, isPending } = useGetIndicatorById(id, locale);

  if (isPending) return <InfoItemSkeleton />;

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
