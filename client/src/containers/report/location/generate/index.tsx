import Link from "next/link";

import { useSyncSearchParams } from "@/app/store";

import { Button } from "@/components/ui/button";

export const GenerateReport = () => {
  const searchParams = useSyncSearchParams();

  return (
    <Link href={`/report/results?${searchParams}`} className="block">
      <Button className="w-full" size="lg">
        Generate Report
      </Button>
    </Link>
  );
};
