import { useTranslations } from "next-intl";

import { useSyncSearchParams, useSyncTopics } from "@/app/store";

import { Media } from "@/containers/media";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export const GenerateReport = () => {
  const t = useTranslations();
  const searchParams = useSyncSearchParams();
  const [, setTopics] = useSyncTopics();

  return (
    <div className="flex w-full items-center justify-between">
      <Media greaterThanOrEqual="lg">
        <Button
          className="w-full border-none"
          size="lg"
          variant="outline"
          onClick={() => setTopics([])}
        >
          {t("grid-sidebar-grid-filters-button-clear-selection")}
        </Button>
      </Media>

      <div className="flex grow items-center justify-end space-x-2">
        <Link href={`/report/results?${searchParams}`} prefetch className="block">
          <Button className="w-full px-4 lg:px-8" size="lg" variant="outline">
            {t("sidebar-report-location-topics-button-generate-select-later")}
          </Button>
        </Link>

        <Link href={`/report/results?${searchParams}`} prefetch className="block grow lg:grow-0">
          <Button className="lg:px-8px-4 w-full grow" size="lg">
            {t("sidebar-report-location-topics-button-generate-report")}
          </Button>
        </Link>
      </div>
    </div>
  );
};
