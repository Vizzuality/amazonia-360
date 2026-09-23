import { Indicator } from "@/types/indicator";

function getReplacedRegionalId(replaces: Indicator["replaces"]): number | null {
  if (!replaces) return null;

  const rawId = typeof replaces === "string" ? replaces : replaces.id;
  const parsedId = Number(rawId);

  return Number.isInteger(parsedId) ? parsedId : null;
}

export function getIndicatorSubstitutionMap(indicators: Indicator[]): Map<number, number> {
  const substitutionMap = new Map<number, number>();

  indicators.forEach((indicator) => {
    const regionalId = getReplacedRegionalId(indicator.replaces);

    if (regionalId !== null) substitutionMap.set(regionalId, indicator.id);
  });

  return substitutionMap;
}

export function getSubstitutedIndicatorId(
  indicatorId: number,
  substitutionMap: Map<number, number>,
): number {
  return substitutionMap.get(indicatorId) ?? indicatorId;
}

/** Both directions, so a widget can go back to the indicator its module replaced. */
export function getIndicatorCounterpartMap(indicators: Indicator[]): Map<number, number> {
  const counterparts = new Map<number, number>();

  indicators.forEach((indicator) => {
    const regionalId = getReplacedRegionalId(indicator.replaces);
    if (regionalId === null) return;

    counterparts.set(regionalId, indicator.id);
    counterparts.set(indicator.id, regionalId);
  });

  return counterparts;
}
