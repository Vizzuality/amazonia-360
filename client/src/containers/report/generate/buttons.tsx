import { useTranslations } from "next-intl";

import { useSyncSearchParams } from "@/app/store";

// import { Media } from "@/containers/media";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export const ReportGenerateButtons = () => {
  const t = useTranslations();
  const searchSelectLaterParams = useSyncSearchParams({
    topics: [],
  });

  return (
    <div className="flex w-full items-center justify-between">
      {/* <Media greaterThanOrEqual="lg">
        <Button className="w-full border-none" variant="outline" onClick={() => setTopics([])}>
          {t("grid-sidebar-grid-filters-button-clear-selection")}
        </Button>
      </Media> */}

      <div className="flex grow flex-col items-center justify-end gap-2 lg:flex-row">
        <Link href={`/report/results${searchSelectLaterParams}`} prefetch className="block w-full">
          <Button className="w-full px-4 lg:px-8" variant="outline">
            {t("sidebar-report-location-topics-button-generate-select-later")}
          </Button>
        </Link>

        <Button className="lg:px-8px-4 w-full grow" type="submit">
          {t("sidebar-report-location-topics-button-generate-report")}
        </Button>
      </div>
    </div>
  );
};
