import { useTranslations } from "next-intl";

import { useSyncSearchParams, useSyncTopics } from "@/app/store";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export const GenerateReport = () => {
  const t = useTranslations();
  const searchParams = useSyncSearchParams();
  const [topics] = useSyncTopics();

  return (
    <Link href={`/report/results?${searchParams}`} prefetch className="block">
      <Button className="w-full" size="lg">
        {t("grid-sidebar-report-location-topics-button-generate-report")} ({topics?.length || 0}{" "}
        {t("grid-sidebar-report-location-topics")})
      </Button>
    </Link>
  );
};
