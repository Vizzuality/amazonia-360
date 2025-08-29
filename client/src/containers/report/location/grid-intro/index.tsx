import { useSetAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { tabAtom } from "@/app/store";

import { WandIcon } from "@/components/ui/icons/wand";
// TO - DO - remove before merge (remove keys from translations)
export default function AmazoniaGridIntro() {
  const t = useTranslations();
  const setTab = useSetAtom(tabAtom);

  return (
    <button
      type="button"
      className="flex items-start gap-2 rounded-sm bg-blue-50 p-2"
      onClick={() => setTab("grid")}
    >
      <WandIcon className="h-6 w-6 shrink-0" />

      <div className="flex flex-col space-y-1 pb-1.5 pt-1 text-left text-sm">
        <span className="font-semibold text-foreground">
          {t("grid-sidebar-report-location-ai-title")}
        </span>
        <div className="flex space-x-4">
          <p className="font-normal text-muted-foreground">
            {t("grid-sidebar-report-location-ai-description")}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 self-center" />
    </button>
  );
}
