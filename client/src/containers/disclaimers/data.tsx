import { useTranslations } from "next-intl";

import Disclaimer from "@/containers/disclaimers";

export default function DataDisclaimer() {
  const t = useTranslations();
  return (
    <Disclaimer className="py-10">
      <div className="container">
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("report-results-disclaimer-part-1")}</p>

          <p className="text-sm font-medium">{t("report-results-disclaimer-part-2")}</p>

          <p className="text-sm font-medium">{t("report-results-disclaimer-part-3")}</p>
        </div>
      </div>
    </Disclaimer>
  );
}
