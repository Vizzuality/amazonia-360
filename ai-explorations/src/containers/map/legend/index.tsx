import { useMemo } from "react";

import { useSyncIndicators } from "@/lib/url-state/store";

import { LegendItem } from "@/containers/map/legend/item";

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
    <div className="absolute right-4 bottom-16 z-10 w-72">
      <Legend defaultOpen>
        <div className="divide-y divide-muted">
          {INDICATORS?.map((indicator) => (
            <LegendItem key={indicator} id={indicator} />
          ))}
        </div>
      </Legend>
    </div>
  );
};

export default LegendContainer;
