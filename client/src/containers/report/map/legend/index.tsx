import { useMemo } from "react";

import { useSyncIndicators } from "@/app/store";

import { LegendItem } from "@/containers/report/map/legend/item";

import Legend from "@/components/map/legend";

const LegendContainer = () => {
  const [indicators] = useSyncIndicators();

  const INDICATORS = useMemo(() => {
    if (!indicators?.length) return null;
    const i = [...indicators];
    return i.toReversed();
  }, [indicators]);

  if (!INDICATORS) return null;

  return (
    <div className="absolute bottom-16 right-4 z-10 w-72">
      <Legend defaultOpen>
        <div className="divide-y divide-muted">
          {INDICATORS?.map((indicator) => <LegendItem key={indicator} id={indicator} />)}
        </div>
      </Legend>
    </div>
  );
};

export default LegendContainer;
