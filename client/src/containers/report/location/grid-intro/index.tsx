import { ChevronRight } from "lucide-react";

import { WandIcon } from "@/components/ui/icons/wand";

export default function AmazoniaGridIntro() {
  return (
    <div className="flex space-x-3 rounded-sm bg-blue-50 p-2">
      <div>
        <WandIcon className="h-6 w-6" />
      </div>
      <div className="flex max-w-64 flex-col space-y-1 text-sm md:max-w-96">
        <span className="font-semibold text-foreground">
          Detect patterns within Amazonia using the Grid
        </span>
        <div className="flex space-x-4">
          <p className="font-normal text-muted-foreground">
            Refine your area selection by using the grid. Add indicators to highlight areas that
            meet specific criteria.
          </p>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </div>
      </div>
    </div>
  );
}
