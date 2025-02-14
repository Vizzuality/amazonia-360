import { useSetAtom } from "jotai";
import { ChevronRight } from "lucide-react";

import { tabAtom } from "@/app/store";

import { WandIcon } from "@/components/ui/icons/wand";

export default function AmazoniaGridIntro() {
  const setTab = useSetAtom(tabAtom);

  return (
    <button
      type="button"
      className="flex space-x-2 rounded-sm bg-blue-50 p-2"
      onClick={() => setTab("grid")}
    >
      <div className="p-1">
        <WandIcon className="h-6 w-6" />
      </div>
      <div className="flex flex-col space-y-1 pb-1.5 pt-1 text-left text-sm">
        <span className="font-semibold text-foreground">
          Detect patterns within Amazonia
          <br /> using the Grid
        </span>
        <div className="flex space-x-4">
          <p className="font-normal text-muted-foreground">
            Redefine your area selection by using the grid. Add indicators to highlight areas that
            meet specific criteria.
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 self-center" />
    </button>
  );
}
