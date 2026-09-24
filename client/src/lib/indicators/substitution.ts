import { Indicator, VisualizationTypes } from "@/types/indicator";

function getReplacedRegionalId(replaces: Indicator["replaces"]): number | null {
  if (!replaces) return null;

  const rawId = typeof replaces === "string" ? replaces : replaces.id;
  const parsedId = Number(rawId);

  return Number.isInteger(parsedId) ? parsedId : null;
}

/** A widget keeps its visualization type across a swap, so the other side has to offer it. */
function offersType(
  indicator: Indicator | undefined,
  type: VisualizationTypes,
): indicator is Indicator {
  return !!indicator?.visualization_types.includes(type);
}

/** Regional id → the module indicator that replaces it. */
export function getIndicatorSubstitutionMap(indicators: Indicator[]): Map<number, Indicator> {
  const substitutionMap = new Map<number, Indicator>();

  indicators.forEach((indicator) => {
    const regionalId = getReplacedRegionalId(indicator.replaces);

    if (regionalId !== null) substitutionMap.set(regionalId, indicator);
  });

  return substitutionMap;
}

/** Keeps the regional id when its replacement cannot render the widget's type. */
export function getSubstitutedIndicatorId(
  indicatorId: number,
  type: VisualizationTypes,
  substitutionMap: Map<number, Indicator>,
): number {
  const replacement = substitutionMap.get(indicatorId);

  return offersType(replacement, type) ? replacement.id : indicatorId;
}

/**
 * Both directions, so a widget can go back to the indicator its module replaced. A pair whose
 * regional indicator is missing from `indicators` is left out: there is nothing to go back to.
 */
export function getIndicatorCounterpartMap(indicators: Indicator[]): Map<number, Indicator> {
  const byId = new Map(indicators.map((indicator) => [indicator.id, indicator]));
  const counterparts = new Map<number, Indicator>();

  indicators.forEach((indicator) => {
    const regionalId = getReplacedRegionalId(indicator.replaces);
    const regional = regionalId === null ? undefined : byId.get(regionalId);
    if (!regional) return;

    counterparts.set(regional.id, indicator);
    counterparts.set(indicator.id, regional);
  });

  return counterparts;
}

export function getIndicatorCounterpart(
  indicatorId: number,
  type: VisualizationTypes,
  counterparts: Map<number, Indicator>,
): Indicator | null {
  const counterpart = counterparts.get(indicatorId);

  return offersType(counterpart, type) ? counterpart : null;
}
