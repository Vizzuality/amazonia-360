import Link from "next/link";

import { useSyncSearchParams, useSyncTopics } from "@/app/store";

import { Button } from "@/components/ui/button";

export const GenerateReport = () => {
  const searchParams = useSyncSearchParams();
  const [topics] = useSyncTopics();

  return (
    <Link href={`/report/results?${searchParams}`} prefetch className="block">
      <Button className="w-full" size="lg">
        Generate Report ({topics?.length || 0} topics)
      </Button>
    </Link>
  );
};
